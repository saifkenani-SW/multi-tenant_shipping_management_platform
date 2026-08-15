import { Pagination } from '../../../../../../common/pagination';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';

export interface ManifestQueryCriteria {
  readonly tenantId?: string;
  readonly status?: ManifestStatus;
  readonly tripId?: string;
  readonly originOrgUnitId?: string;
  readonly destinationOrgUnitId?: string;
  readonly driverId?: string;
  readonly scopeOrgUnitIds?: string[];
  readonly pagination: Pagination;
}
