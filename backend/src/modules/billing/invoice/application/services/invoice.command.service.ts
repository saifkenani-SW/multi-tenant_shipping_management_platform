import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Transactional } from '../../../../../packages/transaction';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import { InvoiceQueryRepository } from '../../infrastructure/repositories/invoice.query.repository';
import { PaymentCommandRepository } from '../../../payment/infrastructure/repositories/payment.command.repository';
import { InvoiceNumberGenerator } from './invoice-number.generator';
import { Invoice } from '../../domain/entities/invoice.entity';
import type { CreateInvoiceForShipmentCommand } from '../dtos/requests/create-invoice-for-shipment.command';
import type { RecordPaymentCommand } from '../../../payment/application/dtos/requests/record-payment.command';
import { DEFAULT_PAYMENT_TERMS_DAYS } from '../../../constants/billing.constants';

@Injectable()
export class InvoiceCommandService {
  constructor(
    private readonly commandRepository: InvoiceCommandRepository,
    private readonly queryRepository: InvoiceQueryRepository,
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
    const existing = await this.queryRepository.findRawByShipmentId(
      command.customerShipmentId,
    );

    if (existing) {
      throw new ConflictException('This shipment already has an invoice.');
    }

    const settings = await this.tenantFacade.getTenantSettings(
      command.tenantId,
    );

    const currency = (settings?.pricing?.defaultCurrency ?? 'SYP')
      .toString()
      .trim();

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
      customerProfileId: command.customerProfileId,
      customerShipmentId: command.customerShipmentId,
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
   * Silent when there is no invoice: a shipment created before this module
   * existed has none, and refusing to cancel such a shipment would be the
   * wrong trade. A paid invoice is a different matter — that is money already
   * taken, and voiding it needs a refund, not a status flip.
   */
  @Transactional()
  async cancelForShipment(customerShipmentId: string): Promise<void> {
    const invoice =
      await this.queryRepository.findAggregateByShipmentId(customerShipmentId);

    if (!invoice) {
      return;
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException(
        'Invoice for this shipment is already paid and cannot be cancelled. Issue a refund instead.',
      );
    }

    invoice.cancel();

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
   * same moment cannot leave the invoice showing only one of them.
   */
  @Transactional()
  async recordPayment(command: RecordPaymentCommand): Promise<{ id: string }> {
    const invoice = await this.queryRepository.findAggregateById(
      command.invoiceId,
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    invoice.assertAcceptsPayment();

    if (command.amount <= 0) {
      throw new ConflictException('A payment must be greater than zero.');
    }

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

    // Read the total back rather than adding to a figure held in memory, so a
    // payment recorded by another request in the meantime is counted too.
    const paidTotal = await this.queryRepository.sumCompletedPayments(
      invoice.id,
    );

    const newStatus = invoice.applyPaidTotal(paidTotal);

    if (newStatus) {
      await this.commandRepository.updateStatus(
        invoice.id,
        newStatus,
        invoice.version,
      );
    }

    return payment;
  }

  /**
   * Sweeps unpaid invoices past their due date into OVERDUE. Driven by the
   * scheduled job, not by a request.
   */
  async markOverdueInvoices(now: Date = new Date()): Promise<number> {
    return this.commandRepository.markOverdueBefore(now);
  }

  private calculateDueDate(): Date {
    const due = new Date();
    due.setDate(due.getDate() + DEFAULT_PAYMENT_TERMS_DAYS);
    return due;
  }
}
