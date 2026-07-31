import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../packages/transaction';
import {
  ITenantCommandRepository,
  CreateTenantData,
  UpdateTenantData,
  CreateSubscriptionData,
} from '../../application/interfaces/tenant.command.repository.interface';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { SubscriptionStatus } from '@prisma/client';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantPersistenceMapper } from '../mappers/tenant.persistence.mapper';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';

@Injectable()
export class TenantCommandRepository implements ITenantCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly tenantPersistenceMapper: TenantPersistenceMapper,
  ) {}

  async create(data: CreateTenantData): Promise<Tenant> {
    const tenant = await this.prisma.client.tenant.create({
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.email,
        is_active: true,
      },
    });

    return this.tenantPersistenceMapper.toDomain(tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id },
    });
    if (!tenant) return null;

    return this.tenantPersistenceMapper.toDomain(tenant);
  }

  async update(id: string, data: UpdateTenantData): Promise<void> {
    await this.prisma.client.tenant.update({
      where: { id },
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.email,
      },
    });
  }

  async updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void> {
    const is_active = status === TenantStatus.ACTIVE;
    const suspended_at = is_active ? null : new Date();
    const suspended_reason = is_active ? null : reason || null;

    await this.prisma.client.tenant.update({
      where: { id },
      data: {
        is_active,
        suspended_at,
        suspended_reason,
      },
    });
  }

  async createSubscription(data: CreateSubscriptionData): Promise<void> {
    await this.prisma.client.tenant_subscription.create({
      data: {
        id: data.id,
        tenant_id: data.tenantId,
        plan_id: data.planId,
        status: data.status,
        started_at: data.startedAt,
        expires_at: data.expiresAt,
        snapshot_max_branches: data.snapshotMaxBranches,
        snapshot_max_warehouses: data.snapshotMaxWarehouses,
        snapshot_max_employees: data.snapshotMaxEmployees,
        snapshot_max_vehicles: data.snapshotMaxVehicles,
        snapshot_max_zones: data.snapshotMaxZones,
        snapshot_max_monthly_shipments: data.snapshotMaxMonthlyShipments,
        snapshot_max_monthly_parcels: data.snapshotMaxMonthlyParcels,
        snapshot_features: data.snapshotFeatures as object,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      },
    });
  }

  async deactivateActiveSubscription(tenantId: string): Promise<void> {
    await this.prisma.client.tenant_subscription.updateMany({
      where: {
        tenant_id: tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: 'System replaced with new subscription',
      },
    });
  }

  async createSubscriptionHistory(
    history: TenantSubscriptionHistory,
  ): Promise<void> {
    await this.prisma.client.tenant_subscription_history.create({
      data: {
        id: history.id,
        tenant_id: history.tenantId,
        subscription_id: history.subscriptionId,
        plan_id: history.planId,
        action: history.action,
        performed_at: history.performedAt,
        previous_plan_id: history.previousPlanId,
        notes: history.notes,
        performed_by: history.performedBy,
      },
    });
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    reason?: string,
  ): Promise<void> {
    await this.prisma.client.tenant_subscription.update({
      where: { id: subscriptionId },
      data: {
        status,
        ...(status === SubscriptionStatus.CANCELLED && {
          cancelled_at: new Date(),
          cancellation_reason: reason ?? null,
        }),
      },
    });
  }

  async updateSubscriptionExpiration(
    subscriptionId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.client.tenant_subscription.update({
      where: { id: subscriptionId },
      data: { expires_at: expiresAt },
    });
  }

  async findActiveSubscription(
    tenantId: string,
  ): Promise<TenantSubscription | null> {
    const record = await this.prisma.client.tenant_subscription.findFirst({
      where: {
        tenant_id: tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { created_at: 'desc' },
    });
    if (!record) return null;
    return this.tenantPersistenceMapper.toSubscriptionDomain(record);
  }

  async findLatestSubscription(
    tenantId: string,
  ): Promise<TenantSubscription | null> {
    const record = await this.prisma.client.tenant_subscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });
    if (!record) return null;
    return this.tenantPersistenceMapper.toSubscriptionDomain(record);
  }

  async findSubscriptionById(
    subscriptionId: string,
  ): Promise<TenantSubscription | null> {
    const record = await this.prisma.client.tenant_subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!record) return null;
    return this.tenantPersistenceMapper.toSubscriptionDomain(record);
  }
}
