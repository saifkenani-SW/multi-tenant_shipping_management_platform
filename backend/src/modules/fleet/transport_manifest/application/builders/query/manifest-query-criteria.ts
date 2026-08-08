import { Pagination } from '../../../../../../common/pagination';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';

export class ManifestQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    public readonly tenantId: string,
    public readonly status?: ManifestStatus,
    public readonly tripId?: string,
    public readonly originOrgUnitId?: string,
    public readonly destinationOrgUnitId?: string,
  ) {}
}
