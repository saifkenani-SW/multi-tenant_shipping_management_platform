import { Pagination } from '../../../../../../common/pagination';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export class TripQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    public readonly tenantId: string,
    public readonly status?: TripStatus,
    public readonly driverId?: string,
    public readonly vehicleId?: string,
    public readonly originOrgUnitId?: string,
    public readonly destinationOrgUnitId?: string,
  ) {}
}
