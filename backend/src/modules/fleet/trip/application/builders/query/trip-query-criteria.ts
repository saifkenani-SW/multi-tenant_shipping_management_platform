import { Pagination } from '../../../../../../common/pagination';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export class TripQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    /**
     * Undefined for a platform owner, who reads across every tenant.
     * Any other caller is always scoped to their own tenant.
     */
    public readonly tenantId: string | undefined,
    public readonly status?: TripStatus,
    public readonly driverId?: string,
    public readonly vehicleId?: string,
    public readonly originOrgUnitId?: string,
    public readonly destinationOrgUnitId?: string,
  ) {}
}
