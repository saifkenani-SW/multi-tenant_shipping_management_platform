import { PaymentMethod } from '@prisma/client';

/**
 * Internal command for taking a payment against an invoice.
 *
 * Built by the customer-shipment module when a parcel is handed over at the
 * branch, or by the invoice controller when a tenant admin settles an invoice
 * directly. Never bound straight from an HTTP body.
 */
export interface RecordPaymentCommand {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;

  /** The member of staff who took the money, when a person took it. */
  collectedByEmployeeId?: string | null;

  /** The branch where it was taken — payment happens at a centre, not a door. */
  organizationUnitId?: string | null;

  transactionReference?: string | null;
}
