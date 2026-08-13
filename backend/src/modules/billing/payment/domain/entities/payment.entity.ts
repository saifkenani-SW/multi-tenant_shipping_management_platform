import { PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * A single payment against an invoice.
 *
 * Immutable financial history: recorded once and never edited or deleted, so
 * this class carries no mutating behaviour. Correcting a payment means adding
 * another record, not rewriting this one.
 */
export class Payment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly collectedByEmployeeId: string | null,
    public readonly organizationUnitId: string | null,
    public readonly amount: number,
    public readonly paymentMethod: PaymentMethod,
    public readonly transactionReference: string | null,
    public readonly status: PaymentStatus,
    public readonly createdAt: Date,
  ) {}

  /** Only a completed payment counts toward what an invoice has collected. */
  countsTowardBalance(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }
}
