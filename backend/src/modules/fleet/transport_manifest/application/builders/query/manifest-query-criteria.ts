import { Pagination } from '../../../../../../common/pagination';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';

export class ManifestQueryCriteria {
  constructor(
    public readonly pagination: Pagination,
    /**
     * Undefined for a platform owner, who reads across every tenant.
     * Any other caller is always scoped to their own tenant.
     */
    public readonly tenantId: string | undefined,
    public readonly status?: ManifestStatus,
    public readonly tripId?: string,
    public readonly originOrgUnitId?: string,
    public readonly destinationOrgUnitId?: string,
  ) {}
}
