import { ParcelCondition, ParcelStatus } from '@prisma/client';

export interface ParcelMergedCriteria {
  tenantId?: string;
  customerShipmentId?: string;
  status?: ParcelStatus;
  condition?: ParcelCondition;
  currentOrgUnitId?: string;
  destinationOrgUnitIds?: string[];

  cursor?: string;
  limit?: number;
}
