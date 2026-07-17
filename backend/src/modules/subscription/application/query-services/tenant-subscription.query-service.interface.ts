import {
  SubscriptionHistoryDto,
  TenantSubscriptionDto,
} from '../dtos/tenant-subscription.dto';

export interface ITenantSubscriptionQueryService {
  getCurrentSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionDto | null>;
  getSubscriptionHistory(tenantId: string): Promise<SubscriptionHistoryDto[]>;
}
