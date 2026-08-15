import { PaymentMethod } from '@prisma/client';

/**
 * Internal command for taking a payment against an invoice.
 *
 * Built by the customer-shipment module when money is taken at the counter
 * (`POST /shipments/:id/payments`) or as optional COD on proof of delivery.
 * Never bound straight from an HTTP body.
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
