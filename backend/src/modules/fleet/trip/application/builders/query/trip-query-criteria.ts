import { Pagination } from '../../../../../../common/pagination';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export interface TripQueryCriteria {
  readonly tenantId?: string;
  readonly scopeOrgUnitIds?: string[];
  readonly status?: TripStatus;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly originOrgUnitId?: string;
  readonly destinationOrgUnitId?: string;
  readonly tripIds?: string[];
  readonly pagination: Pagination;
}
