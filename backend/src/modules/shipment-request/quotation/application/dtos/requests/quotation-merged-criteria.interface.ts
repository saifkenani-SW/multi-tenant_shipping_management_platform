import { QuotationStatus, ServiceLevel } from '@prisma/client';

export interface QuotationMergedCriteria {
  tenantId?: string;
  originOrgUnitId?: string;
  destinationOrgUnitId?: string;
  serviceLevel?: ServiceLevel;
  status?: QuotationStatus;

  // Pagination
  cursor?: string;
  limit?: number;
}

