import { TenantSubscription } from '../aggregates/tenant-subscription.aggregate';

export interface ITenantSubscriptionRepository {
  save(subscription: TenantSubscription): Promise<void>;
  findById(id: string): Promise<TenantSubscription | null>;
  findCurrentByTenantId(tenantId: string): Promise<TenantSubscription | null>;
}
