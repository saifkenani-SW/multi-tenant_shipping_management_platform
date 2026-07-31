import { Pagination } from '../../../../../common/pagination';
import { PermissionSearchField } from '../../enums/permission-search-field.enum';

export interface PermissionQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: PermissionSearchField;
}

export interface PermissionQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: PermissionQueryCriteriaSearch;
  readonly resource?: string;
}

export class PermissionQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: PermissionQueryCriteriaSearch;
  readonly resource?: string;

  constructor(props: PermissionQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.resource = props.resource;

    Object.freeze(this);
  }
}
