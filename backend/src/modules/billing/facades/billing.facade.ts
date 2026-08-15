import { Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { InvoiceCommandService } from '../invoice/application/services/invoice.command.service';
import { InvoiceQueryService } from '../invoice/application/services/invoice.query.service';
import type { CreateInvoiceForShipmentCommand } from '../invoice/application/dtos/requests/create-invoice-for-shipment.command';
import type { RecordPaymentCommand } from '../payment/application/dtos/requests/record-payment.command';
import { InvoiceDetailsResponseDto } from '../invoice/application/dtos/responses/invoice-details.response.dto';

/**
 * The only entry point into Billing.
 *
 * Invoices, payments and the numbering counter are internal: other modules must
 * not reach their services, repositories or tables directly.
 *
 * Every method here is meant to be called from inside the caller's own
 * transaction. Raising an invoice is not an optional side effect of creating a
 * shipment — it is part of the same act — so this is a direct call rather than
 * an event, and a failure here fails the shipment with it.
 */
@Injectable()
export class BillingFacade {
  constructor(
    private readonly invoiceCommandService: InvoiceCommandService,
    private readonly invoiceQueryService: InvoiceQueryService,
  ) {}

  /** Raises the invoice for a newly created shipment. */
  async createInvoiceForShipment(
    command: CreateInvoiceForShipmentCommand,
  ): Promise<{ id: string; invoiceNumber: string }> {
    return this.invoiceCommandService.createForShipment(command);
  }

  /**
   * Cancels the invoice of a cancelled shipment.
   *
   * Pass the shipment status from *before* the cancel write. Refunds run only
   * for PENDING. RETURNED never refunds and never voids the invoice.
   */
  async cancelInvoiceForShipment(
    customerShipmentId: string,
    shipmentStatus: ShipmentStatus,
  ): Promise<void> {
    await this.invoiceCommandService.cancelForShipment(
      customerShipmentId,
      shipmentStatus,
    );
  }

  /**
   * Records money collected against an invoice — typically at the branch, as a
   * parcel is handed over.
   */
  async recordPayment(command: RecordPaymentCommand): Promise<{ id: string }> {
    return this.invoiceCommandService.recordPayment(command);
  }

  /** Same as recordPayment, looked up from the shipment rather than the invoice id. */
  async recordPaymentForShipment(
    customerShipmentId: string,
    command: Omit<RecordPaymentCommand, 'invoiceId'>,
  ): Promise<{ id: string }> {
    return this.invoiceCommandService.recordPaymentForShipment(
      customerShipmentId,
      command,
    );
  }

  /**
   * Refuses handover until the shipment invoice is fully paid. A payment
   * recorded earlier in the same transaction is visible here.
   */
  async assertSettledForDelivery(customerShipmentId: string): Promise<void> {
    await this.invoiceCommandService.assertSettledForDelivery(
      customerShipmentId,
    );
  }

  /**
   * The invoice of a shipment, with its payments.
   *
   * The caller is expected to have authorised the shipment first: an invoice
   * carries no visibility rules of its own, it inherits the shipment's.
   */
  async getInvoiceForShipment(
    customerShipmentId: string,
  ): Promise<InvoiceDetailsResponseDto> {
    return this.invoiceQueryService.findByShipmentId(customerShipmentId);
  }
}
