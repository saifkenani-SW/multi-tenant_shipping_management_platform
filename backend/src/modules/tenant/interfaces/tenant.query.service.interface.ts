import { PaginatedTenantListDto } from '../dtos/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/tenant-details.dto';

import { TenantSearchField } from '../dtos/tenant-query.dto';

export interface ITenantQueryService {
  findTenants(
    page: number,
    limit: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<PaginatedTenantListDto>;
  getTenantDetails(id: string): Promise<TenantDetailsDto | null>;
}
