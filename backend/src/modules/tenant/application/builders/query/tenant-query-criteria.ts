import { TenantSearchField } from '../../../domain/enums/tenant-search-field.enum';
import { TenantStatus } from '../../../domain/enums/tenant-status.enum';
import { Pagination } from '../../../../../common/pagination';

export interface TenantQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: {
    readonly keyword: string;
    readonly field: TenantSearchField;
  };
  readonly status?: TenantStatus;
  readonly tenantId?: string;
}
