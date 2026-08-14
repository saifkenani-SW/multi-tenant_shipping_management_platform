import { InvoiceStatus, PaymentResponsibility } from '@prisma/client';

/**
 * The single set of constraints handed to the repository, produced by merging
 * the caller filter with the mandatory visibility scope. Scope always wins.
 */
export interface InvoiceMergedCriteria {
  tenantId?: string;
  status?: InvoiceStatus;
  senderPhone?: string;
  customerShipmentId?: string;
  paymentResponsibility?: PaymentResponsibility;

  /** A single branch the caller asked for, at either end of the route. */
  orgUnitId?: string;

  /**
   * Branches the caller is assigned to. An invoice matches when either end of
   * its route is one of these.
   */
  scopedOrgUnitIds?: string[];

  issuedFrom?: Date;
  issuedTo?: Date;
  dueBefore?: Date;

  cursor?: string;
  limit?: number;
}
