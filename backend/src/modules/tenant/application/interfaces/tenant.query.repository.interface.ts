import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantQueryCriteria } from '../builders/query/tenant-query-criteria';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';

export interface ITenantQueryRepository {
  findMany(criteria: TenantQueryCriteria): Promise<[Tenant[], number]>;
  findById(id: string): Promise<Tenant | null>;
  findActiveSubscription(tenantId: string): Promise<TenantSubscription | null>;
  findSubscriptionHistory(
    tenantId: string,
  ): Promise<TenantSubscriptionHistory[]>;
}
