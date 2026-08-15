import { RequestStatus } from '@prisma/client';

export interface ShipmentRequestMergedCriteria {
  customerProfileId?: string;
  targetTenantId?: string;
  originGlobalLocationId?: string;
  destinationGlobalLocationId?: string;
  senderPhone?: string;
  receiverPhone?: string;
  status?: RequestStatus;

  // Quotation visibility scope constraints — when present, only requests
  // that have at least one matching quotation will be returned.
  quotationTenantId?: string;
  quotationOrgUnitIds?: string[];

  // Pagination
  cursor?: string;
  limit?: number;
}
