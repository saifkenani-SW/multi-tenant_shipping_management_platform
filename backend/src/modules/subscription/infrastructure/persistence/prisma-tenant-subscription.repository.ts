import { Injectable } from '@nestjs/common';
import { ITenantSubscriptionRepository } from '../../domain/repositories/tenant-subscription.repository.interface';
import { TenantSubscription } from '../../domain/aggregates/tenant-subscription.aggregate';
import { SubscriptionHistory } from '../../domain/entities/subscription-history.entity';
import { TenantSubscriptionStatus } from '../../domain/value-objects/subscription.enums';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class PrismaTenantSubscriptionRepository implements ITenantSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(subscription: TenantSubscription): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      // Upsert the main subscription
      await tx.tenant_subscription.upsert({
        where: { id: subscription.id },
        create: {
          id: subscription.id,
          tenant_id: subscription.tenantId,
          plan_id: subscription.planId,
          started_at: subscription.startDate,
          expires_at: subscription.endDate,
          status: subscription.status as any,
          created_at: subscription.createdAt,
          updated_at: subscription.updatedAt,
          snapshot_max_branches: 0,
          snapshot_max_warehouses: 0,
          snapshot_max_employees: 0,
          snapshot_max_vehicles: 0,
          snapshot_max_zones: 0,
          snapshot_features: {},
        },
        update: {
          plan_id: subscription.planId,
          started_at: subscription.startDate,
          expires_at: subscription.endDate,
          status: subscription.status as any,
          updated_at: subscription.updatedAt,
        },
      });

      // Upsert all history records
      for (const historyRecord of subscription.history) {
        await tx.tenant_subscription_history.upsert({
          where: { id: historyRecord.id },
          create: {
            id: historyRecord.id,
            tenant_id: subscription.tenantId,
            subscription_id: historyRecord.tenantSubscriptionId,
            plan_id: historyRecord.planId,
            action: 'CREATED',
            performed_at: historyRecord.recordedAt,
          },
          update: {
            performed_at: historyRecord.recordedAt,
          },
        });
      }
    });
  }

  async findById(id: string): Promise<TenantSubscription | null> {
    const raw = await this.prisma.tenant_subscription.findUnique({
      where: { id },
      include: { tenant_subscription_history: true },
    });
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  async findCurrentByTenantId(
    tenantId: string,
  ): Promise<TenantSubscription | null> {
    const raw = await this.prisma.tenant_subscription.findFirst({
      where: {
        tenant_id: tenantId,
        status: { in: ['ACTIVE', 'SUSPENDED'] },
      },
      include: { tenant_subscription_history: true },
    });
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  private mapToDomain(raw: any): TenantSubscription {
    const history = raw.tenant_subscription_history.map((h: any) =>
      SubscriptionHistory.reconstitute({
        id: h.id,
        tenantSubscriptionId: h.subscription_id,
        planId: h.plan_id,
        startDate: raw.started_at,
        endDate: raw.expires_at,
        recordedAt: h.performed_at,
      }),
    );

    return TenantSubscription.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      planId: raw.plan_id,
      startDate: raw.started_at,
      endDate: raw.expires_at,
      status: raw.status as TenantSubscriptionStatus,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      history,
    });
  }
}
