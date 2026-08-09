import { ShipmentStatus } from '@prisma/client';

/**
 * The single set of constraints handed to the repository, produced by merging
 * the caller's filter with the mandatory visibility scope. Scope always wins.
 */
export interface ShipmentMergedCriteria {
  tenantId?: string;
  senderCustomerProfileId?: string;
  originOrgUnitId?: string;
  originOrgUnitIds?: string[];
  destinationOrgUnitId?: string;
  status?: ShipmentStatus;
  receiverPhone?: string;

  // Pagination
  cursor?: string;
  limit?: number;
}
