import { Pagination } from '../../../../common/pagination';
import { GlobalLocationSearchField } from '../../enums/global-location-search-field.enum';
import { LocationType } from '../../enums/location-type.enum';

export interface GlobalLocationQueryCriteriaSearch {
  readonly keyword: string;
  readonly field: GlobalLocationSearchField;
}

export interface GlobalLocationQueryCriteriaProps {
  readonly pagination: Pagination;
  readonly search?: GlobalLocationQueryCriteriaSearch;
  readonly type?: LocationType;
  /** null يعني الجذور فقط؛ undefined يعني بلا تصفية. */
  readonly parentId?: string | null;
}

export class GlobalLocationQueryCriteria {
  readonly pagination: Pagination;
  readonly search?: GlobalLocationQueryCriteriaSearch;
  readonly type?: LocationType;
  readonly parentId?: string | null;

  constructor(props: GlobalLocationQueryCriteriaProps) {
    this.pagination = props.pagination;
    this.search = props.search ? Object.freeze({ ...props.search }) : undefined;
    this.type = props.type;
    this.parentId = props.parentId;

    Object.freeze(this);
  }
}
