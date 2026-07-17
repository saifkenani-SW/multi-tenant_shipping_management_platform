import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';

import { TenantSearchField } from '../enums/tenant-search-field.enum';

export interface ITenantQueryService {
  findTenants(
    page: number,
    limit: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<PaginatedTenantListDto>;
  getTenantDetails(id: string): Promise<TenantDetailsDto | null>;
}
