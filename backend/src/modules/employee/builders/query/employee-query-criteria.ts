import { Pagination } from '../../../../common/pagination';
import { EmployeeSearchField } from '../../enums/employee-search-field.enum';

export interface EmployeeQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: EmployeeSearchField;
}

export interface EmployeeQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: EmployeeQueryCriteriaSearch;
  readonly isActive?: boolean;
  readonly organizationUnitId?: string;
  readonly tenantId?: string;
}

export class EmployeeQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: EmployeeQueryCriteriaSearch;
  readonly isActive?: boolean;
  readonly organizationUnitId?: string;
  readonly tenantId?: string;

  constructor(props: EmployeeQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.isActive = props.isActive;
    this.organizationUnitId = props.organizationUnitId;
    this.tenantId = props.tenantId;

    Object.freeze(this);
  }
}
