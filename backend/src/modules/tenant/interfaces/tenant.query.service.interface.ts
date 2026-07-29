import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import { TenantQueryDto } from '../dtos/requests/tenant-query.dto';

export interface ITenantQueryService {
  findTenants(query: TenantQueryDto): Promise<PaginatedTenantListDto>;
  getTenantDetails(id: string): Promise<TenantDetailsDto>;
}
