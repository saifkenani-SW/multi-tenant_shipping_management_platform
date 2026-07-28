import { Pagination } from '../../../../common/pagination';
import { RoleSearchField } from '../../enums/role-search-field.enum';

export interface RoleQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: RoleSearchField;
}

export interface RoleQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: RoleQueryCriteriaSearch;
  readonly isActive?: boolean;
  readonly tenantId?: string;
}

export class RoleQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: RoleQueryCriteriaSearch;
  readonly isActive?: boolean;
  readonly tenantId?: string;

  constructor(props: RoleQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.isActive = props.isActive;
    this.tenantId = props.tenantId;

    Object.freeze(this);
  }
}
