import { ShipmentStatus } from '@prisma/client';

/**
 * The single set of constraints handed to the repository, produced by merging
 * the caller's filter with the mandatory visibility scope. Scope always wins.
 */
export interface ShipmentMergedCriteria {
  tenantId?: string;
  originOrgUnitId?: string;
  orgUnitIds?: string[];
  destinationOrgUnitId?: string;
  status?: ShipmentStatus;
  senderPhone?: string;
  receiverPhone?: string;
  customerPhone?: string;

  // Pagination
  cursor?: string;
  limit?: number;
}
