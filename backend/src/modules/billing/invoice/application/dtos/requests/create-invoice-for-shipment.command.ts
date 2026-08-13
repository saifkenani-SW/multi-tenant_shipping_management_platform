import { PaymentResponsibility } from '@prisma/client';

/**
 * Everything Billing needs to raise an invoice for a shipment.
 *
 * This is an internal command, not an HTTP body: it is only ever built by the
 * customer-shipment module and handed to BillingFacade. There is deliberately
 * no endpoint that accepts it, because an invoice has no meaning apart from the
 * shipment that caused it.
 *
 * The money arrives already decided. Billing does not price anything — it does
 * not know about quotations or zone pricing, and does not need to. The one
 * thing it resolves for itself is the currency, which is a financial concern
 * rather than a shipping one.
 */
export interface CreateInvoiceForShipmentCommand {
  tenantId: string;
  customerShipmentId: string;

  /** Who owes the money — the party named by paymentResponsibility. */
  customerProfileId: string;

  /** Both ends of the route: staff at either branch handle this invoice. */
  originOrgUnitId: string;
  destinationOrgUnitId: string;

  paymentResponsibility: PaymentResponsibility;

  /** Charge before fees, tax and discount. */
  subtotal: number;
  handlingFees?: number;
  taxAmount?: number;
  discountAmount?: number;
}
