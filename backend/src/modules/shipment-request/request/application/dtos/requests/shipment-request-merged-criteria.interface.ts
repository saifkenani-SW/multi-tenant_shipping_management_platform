import { RequestStatus } from '@prisma/client';

export interface ShipmentRequestMergedCriteria {
  customerProfileId?: string;
  targetTenantId?: string;
  originGlobalLocationId?: string;
  destinationGlobalLocationId?: string;
  senderPhone?: string;
  receiverPhone?: string;
  status?: RequestStatus;

  // Pagination
  cursor?: string;
  limit?: number;
}

