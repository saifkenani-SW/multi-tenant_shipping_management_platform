import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, PaymentStatus, ShipmentStatus } from '@prisma/client';
import { Transactional } from '../../../../../packages/transaction';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import { PaymentCommandRepository } from '../../../payment/infrastructure/repositories/payment.command.repository';
import { InvoiceNumberGenerator } from './invoice-number.generator';
import { Invoice } from '../../domain/entities/invoice.entity';
import type { CreateInvoiceForShipmentCommand } from '../dtos/requests/create-invoice-for-shipment.command';
import type { RecordPaymentCommand } from '../../../payment/application/dtos/requests/record-payment.command';
import {
  DEFAULT_PAYMENT_TERMS_DAYS,
  resolveCurrency,
} from '../../../constants/billing.constants';

@Injectable()
export class InvoiceCommandService {
  constructor(
    private readonly commandRepository: InvoiceCommandRepository,
    private readonly paymentCommandRepository: PaymentCommandRepository,
    private readonly numberGenerator: InvoiceNumberGenerator,
    private readonly tenantFacade: TenantFacade,
  ) {}

  /**
   * Raises the invoice for a shipment.
   *
   * Called only from the customer-shipment module, inside the transaction that
   * creates the shipment: a shipment without its invoice is not a state this
   * system should ever hold.
   *
   * The money arrives already decided — Billing prices nothing. Currency and
   * the invoice number are the two things it resolves for itself, both being
   * financial concerns the shipping side has no reason to know about.
   */
  @Transactional()
  async createForShipment(
    command: CreateInvoiceForShipmentCommand,
  ): Promise<{ id: string; invoiceNumber: string }> {
    const alreadyBilled = await this.commandRepository.existsForShipment(
      command.customerShipmentId,
    );

    if (alreadyBilled) {
      throw new ConflictException('This shipment already has an invoice.');
    }

    const settings = await this.tenantFacade.getTenantSettings(
      command.tenantId,
    );

    const currency = resolveCurrency(settings?.pricing?.defaultCurrency);

    const invoiceNumber = await this.numberGenerator.next(
      command.tenantId,
      settings?.operational?.trackingPrefix ?? null,
    );

    const handlingFees = command.handlingFees ?? 0;
    const taxAmount = command.taxAmount ?? 0;
    const discountAmount = command.discountAmount ?? 0;

    const totalAmount = Invoice.calculateTotal({
      subtotal: command.subtotal,
      handlingFees,
      taxAmount,
      discountAmount,
    });

    const created = await this.commandRepository.create({
      tenantId: command.tenantId,
      customerShipmentId: command.customerShipmentId,
      senderName: command.senderName,
      senderPhone: command.senderPhone,
      receiverName: command.receiverName,
      receiverPhone: command.receiverPhone,
      originOrgUnitId: command.originOrgUnitId,
      destinationOrgUnitId: command.destinationOrgUnitId,
      invoiceNumber,
      subtotal: command.subtotal,
      handlingFees,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentResponsibility: command.paymentResponsibility,
      currency,
      status: InvoiceStatus.UNPAID,
      dueDate: this.calculateDueDate(),
    });

    return { id: created.id, invoiceNumber };
  }

  /**
   * Cancels the invoice belonging to a cancelled shipment.
   *
   * Silent when there is no invoice. Unpaid invoices are just voided.
   *
   * Money already taken is refunded only while the shipment is still PENDING —
   * cancelled before work started. A returned shipment is a logistics outcome
   * and is never refunded; any other status keeps the money and refuses cancel.
   */
  @Transactional()
  async cancelForShipment(
    customerShipmentId: string,
    shipmentStatus: ShipmentStatus,
  ): Promise<void> {
    const invoice =
      await this.commandRepository.findAggregateByShipmentId(
        customerShipmentId,
      );

    if (!invoice) {
      return;
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return;
    }

    if (shipmentStatus === ShipmentStatus.RETURNED) {
      throw new ConflictException(
        'A returned shipment is not refunded and its invoice is not cancelled.',
      );
    }

    const paidTotal = await this.commandRepository.sumCompletedPayments(
      invoice.id,
    );

    if (paidTotal > 0) {
      if (shipmentStatus !== ShipmentStatus.PENDING) {
        throw new ConflictException(
          'Refund is only possible while the shipment is still pending.',
        );
      }

      await this.paymentCommandRepository.create({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        amount: paidTotal,
        paymentMethod: PaymentMethod.CASH,
        collectedByEmployeeId: null,
        organizationUnitId: null,
        transactionReference: `REFUND:${invoice.invoiceNumber}`,
        status: PaymentStatus.REFUNDED,
      });

      invoice.cancelAfterRefund();
    } else {
      invoice.cancel(paidTotal);
    }

    await this.commandRepository.updateStatus(
      invoice.id,
      invoice.status,
      invoice.version,
    );
  }

  /**
   * Records a payment and re-derives the invoice status from everything
   * collected so far.
   *
   * Both writes share one transaction, and the status write is guarded by the
   * version the invoice was loaded with, so two counters taking money at the
   * same moment cannot leave the invoice showing only one of them. The version
   * is always bumped, even when status does not change, so two overlapping
   * partial payments cannot both commit.
   */
  @Transactional()
  async recordPayment(command: RecordPaymentCommand): Promise<{ id: string }> {
    const invoice = await this.commandRepository.findAggregateById(
      command.invoiceId,
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.collectAgainst(invoice, command);
  }

  @Transactional()
  async recordPaymentForShipment(
    customerShipmentId: string,
    command: Omit<RecordPaymentCommand, 'invoiceId'>,
  ): Promise<{ id: string }> {
    const invoice =
      await this.commandRepository.findAggregateByShipmentId(
        customerShipmentId,
      );

    if (!invoice) {
      throw new NotFoundException('This shipment has no invoice');
    }

    return this.collectAgainst(invoice, {
      ...command,
      invoiceId: invoice.id,
    });
  }

  /**
   * Delivery is not allowed while anything is still owed. Uses the Prisma
   * connection so a payment recorded earlier in the same transaction is seen.
   */
  async assertSettledForDelivery(customerShipmentId: string): Promise<void> {
    const invoice =
      await this.commandRepository.findAggregateByShipmentId(
        customerShipmentId,
      );

    if (!invoice) {
      throw new ConflictException(
        'This shipment has no invoice and cannot be delivered.',
      );
    }

    if (!invoice.isFullyPaid()) {
      throw new ConflictException(
        'Parcel cannot be delivered until the invoice is fully paid.',
      );
    }
  }

  /**
   * Sweeps unpaid invoices past their due date into OVERDUE. Driven by the
   * scheduled job, not by a request.
   */
  async markOverdueInvoices(now: Date = new Date()): Promise<number> {
    return this.commandRepository.markOverdueBefore(now);
  }

  private async collectAgainst(
    invoice: Invoice,
    command: RecordPaymentCommand,
  ): Promise<{ id: string }> {
    const paidSoFar = await this.commandRepository.sumCompletedPayments(
      invoice.id,
    );

    invoice.assertAcceptsPayment(command.amount, paidSoFar);

    const payment = await this.paymentCommandRepository.create({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      amount: command.amount,
      paymentMethod: command.paymentMethod,
      collectedByEmployeeId: command.collectedByEmployeeId ?? null,
      organizationUnitId: command.organizationUnitId ?? null,
      transactionReference: command.transactionReference ?? null,
      status: PaymentStatus.COMPLETED,
    });

    const paidTotal = paidSoFar + command.amount;
    const newStatus = invoice.applyPaidTotal(paidTotal);

    await this.commandRepository.updateStatus(
      invoice.id,
      newStatus ?? invoice.status,
      invoice.version,
    );

    return payment;
  }

  private calculateDueDate(): Date {
    const due = new Date();
    due.setDate(due.getDate() + DEFAULT_PAYMENT_TERMS_DAYS);
    return due;
  }
}
