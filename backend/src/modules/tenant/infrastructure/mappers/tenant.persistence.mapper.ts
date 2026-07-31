import { Injectable } from '@nestjs/common';
import {
  tenant,
  tenant_subscription,
  tenant_subscription_history,
} from '@prisma/client';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';

@Injectable()
export class TenantPersistenceMapper {
  toDomain(record: tenant): Tenant {
    return new Tenant(
      record.id,
      record.name,
      record.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      record.tax_number,
      record.email,
      record.created_at,
      record.updated_at,
      record.suspended_at,
      record.suspended_reason,
      record.phone,
      record.logo_url,
      record.is_active,
    );
  }

  toSubscriptionDomain(record: tenant_subscription): TenantSubscription {
    return new TenantSubscription(
      record.id,
      record.tenant_id,
      record.plan_id,
      record.status as SubscriptionStatus,
      record.started_at,
      record.expires_at,
      record.snapshot_max_branches,
      record.snapshot_max_warehouses,
      record.snapshot_max_employees,
      record.snapshot_max_vehicles,
      record.snapshot_max_zones,
      record.snapshot_max_monthly_shipments,
      record.snapshot_max_monthly_parcels,
      record.snapshot_features as Record<string, unknown>,
      record.created_at,
      record.updated_at,
      record.cancelled_at,
      record.cancellation_reason,
    );
  }

  toSubscriptionHistoryDomain(
    record: tenant_subscription_history,
  ): TenantSubscriptionHistory {
    return new TenantSubscriptionHistory(
      record.id,
      record.tenant_id,
      record.subscription_id,
      record.plan_id,
      record.action,
      record.performed_at,
      record.previous_plan_id,
      record.notes,
      record.performed_by,
    );
  }
}
