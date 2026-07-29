import { Pagination } from '../../../../common/pagination';
import { OrgType } from '../../enums/org-type.enum';
import { OrganizationUnitSearchField } from '../../enums/organization-unit-search-field.enum';

export interface OrganizationUnitQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: OrganizationUnitSearchField;
}

export interface OrganizationUnitQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: OrganizationUnitQueryCriteriaSearch;
  readonly orgType?: OrgType;
  readonly isActive?: boolean;
  readonly zoneId?: string;
  /** null يعني الجذور فقط؛ undefined يعني بلا تصفية. */
  readonly parentId?: string | null;
  readonly tenantId?: string;
}

export class OrganizationUnitQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: OrganizationUnitQueryCriteriaSearch;
  readonly orgType?: OrgType;
  readonly isActive?: boolean;
  readonly zoneId?: string;
  readonly parentId?: string | null;
  readonly tenantId?: string;

  constructor(props: OrganizationUnitQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.orgType = props.orgType;
    this.isActive = props.isActive;
    this.zoneId = props.zoneId;
    this.parentId = props.parentId;
    this.tenantId = props.tenantId;

    Object.freeze(this);
  }
}
