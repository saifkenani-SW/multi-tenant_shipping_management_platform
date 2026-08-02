import { Pagination } from '../../../../../common/pagination';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class VehicleQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    public readonly tenantId: string,
    public readonly search?: string,
    public readonly status?: VehicleStatus,
    public readonly type?: VehicleType,
  ) {}
}
