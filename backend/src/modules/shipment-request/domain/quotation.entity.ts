import { QuotationStatus } from '@prisma/client';

/**
 * Quotation Domain Entity (read-side view, scoped to shipment-request module).
 * Creation of quotations is out of scope here — this module only lists and
 * lets the customer approve one.
 */
export class Quotation {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly amount: number,
    public readonly status: QuotationStatus,
    public readonly validUntil: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
  ) {}
}
