import { Injectable } from '@nestjs/common';
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
   * Cancels the invoice of a cancelled shipment. Does nothing when the shipment
   * has none; refuses when the money has already been taken.
   */
  async cancelInvoiceForShipment(customerShipmentId: string): Promise<void> {
    await this.invoiceCommandService.cancelForShipment(customerShipmentId);
  }

  /**
   * Records money collected against an invoice — typically at the branch, as a
   * parcel is handed over.
   */
  async recordPayment(command: RecordPaymentCommand): Promise<{ id: string }> {
    return this.invoiceCommandService.recordPayment(command);
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
