import { Pagination } from '../../../../../../common/pagination';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class VehicleQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    /**
     * Undefined for a platform owner, who reads across every tenant.
     * Any other caller is always scoped to their own tenant.
     */
    public readonly tenantId: string | undefined,
    public readonly search?: string,
    public readonly status?: VehicleStatus,
    public readonly type?: VehicleType,
  ) {}
}
