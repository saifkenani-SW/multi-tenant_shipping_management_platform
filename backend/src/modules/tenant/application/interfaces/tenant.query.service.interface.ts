import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import { TenantQueryDto } from '../dtos/requests/tenant-query.dto';
import { TenantSubscriptionDto } from '../dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../dtos/responses/tenant-subscription-history.dto';

export interface ITenantQueryService {
  findTenants(query: TenantQueryDto): Promise<PaginatedTenantListDto>;
  getTenantDetails(id: string): Promise<TenantDetailsDto>;
  getTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionDto | null>;
  getTenantSubscriptionHistory(
    tenantId: string,
  ): Promise<TenantSubscriptionHistoryDto[]>;
}
