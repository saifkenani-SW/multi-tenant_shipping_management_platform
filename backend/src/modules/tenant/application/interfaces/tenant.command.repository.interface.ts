import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';

export type CreateTenantData = Pick<
  Tenant,
  'name' | 'taxNumber' | 'email' | 'phone' | 'logoUrl'
>;
export type UpdateTenantData = Partial<CreateTenantData>;

export type CreateSubscriptionData = Pick<
  TenantSubscription,
  | 'createdAt'
  | 'expiresAt'
  | 'id'
  | 'planId'
  | 'snapshotFeatures'
  | 'snapshotMaxBranches'
  | 'snapshotMaxEmployees'
  | 'snapshotMaxMonthlyParcels'
  | 'snapshotMaxMonthlyShipments'
  | 'snapshotMaxVehicles'
  | 'snapshotMaxWarehouses'
  | 'snapshotMaxZones'
  | 'startedAt'
  | 'status'
  | 'tenantId'
  | 'updatedAt'
  | 'cancelledAt'
  | 'cancellationReason'
>;
export type UpdateSubscriptionData = Partial<CreateSubscriptionData>;

export interface ITenantCommandRepository {
  create(data: CreateTenantData): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  update(id: string, data: UpdateTenantData): Promise<void>;
  updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void>;
  createSubscription(data: CreateSubscriptionData): Promise<void>;
  deactivateActiveSubscription(tenantId: string): Promise<void>;
  createSubscriptionHistory(history: TenantSubscriptionHistory): Promise<void>;
  updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    reason?: string,
  ): Promise<void>;
  updateSubscriptionExpiration(
    subscriptionId: string,
    expiresAt: Date,
  ): Promise<void>;
  findActiveSubscription(tenantId: string): Promise<TenantSubscription | null>;
  findLatestSubscription(tenantId: string): Promise<TenantSubscription | null>;
  findSubscriptionById(
    subscriptionId: string,
  ): Promise<TenantSubscription | null>;
}
