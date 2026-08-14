import { ParcelCondition, ParcelStatus } from '@prisma/client';

export interface ParcelMergedCriteria {
  tenantId?: string;
  customerShipmentId?: string;
  statuses?: ParcelStatus[];
  condition?: ParcelCondition;
  currentOrgUnitId?: string;
  scopeOrgUnitIds?: string[];
  customerPhone?: string;

  cursor?: string;
  limit?: number;
}
