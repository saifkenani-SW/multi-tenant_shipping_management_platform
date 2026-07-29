import { TenantSearchField } from '../../enums/tenant-search-field.enum';
import { TenantStatus } from '../../enums/tenant-status.enum';
import { Pagination } from '../../../../common/pagination';

export interface TenantQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: TenantSearchField;
}

export interface TenantQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: TenantQueryCriteriaSearch;
  readonly status?: TenantStatus;
  readonly tenantId?: string;
}

export class TenantQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: TenantQueryCriteriaSearch;
  readonly status?: TenantStatus;
  readonly tenantId?: string;

  constructor(props: TenantQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.status = props.status;
    this.tenantId = props.tenantId;

    Object.freeze(this);
  }
}
