import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionPlanQueryService } from '../../application/query-services/subscription-plan.query-service.interface';
import { ITenantSubscriptionQueryService } from '../../application/query-services/tenant-subscription.query-service.interface';
import { SubscriptionPlanDto } from '../../application/dtos/subscription-plan.dto';
import {
  SubscriptionHistoryDto,
  TenantSubscriptionDto,
} from '../../application/dtos/tenant-subscription.dto';
import {
  SubscriptionPlanStatus,
  TenantSubscriptionStatus,
} from '../../domain/value-objects/subscription.enums';

@Injectable()
export class KyselySubscriptionQueryService
  implements ISubscriptionPlanQueryService, ITenantSubscriptionQueryService
{
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: any, // any represents the Kysely<Database> instance
  ) {}

  async findAllPlans(): Promise<SubscriptionPlanDto[]> {
    const rows = await this.db
      .selectFrom('subscription_plans')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      priceAmount: Number(row.price_amount),
      priceCurrency: row.price_currency,
      billingCycle: row.billing_cycle,
      features: row.features || [],
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async findActivePlans(): Promise<SubscriptionPlanDto[]> {
    const rows = await this.db
      .selectFrom('subscription_plans')
      .selectAll()
      .where('status', '=', SubscriptionPlanStatus.ACTIVE)
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      priceAmount: Number(row.price_amount),
      priceCurrency: row.price_currency,
      billingCycle: row.billing_cycle,
      features: row.features || [],
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async getCurrentSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionDto | null> {
    const row = await this.db
      .selectFrom('tenant_subscriptions')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('status', 'in', [
        TenantSubscriptionStatus.ACTIVE,
        TenantSubscriptionStatus.SUSPENDED,
      ])
      .executeTakeFirst();

    if (!row) return null;

    // Fetch history
    const historyRows = await this.db
      .selectFrom('subscription_history')
      .selectAll()
      .where('tenant_subscription_id', '=', row.id)
      .orderBy('recorded_at', 'desc')
      .execute();

    return {
      id: row.id,
      tenantId: row.tenant_id,
      planId: row.plan_id,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      history: historyRows.map((h: any) => ({
        id: h.id,
        planId: h.plan_id,
        startDate: h.start_date,
        endDate: h.end_date,
        recordedAt: h.recorded_at,
      })),
    };
  }

  async getSubscriptionHistory(
    tenantId: string,
  ): Promise<SubscriptionHistoryDto[]> {
    // First, verify the tenant has a subscription or get all subscriptions for the tenant
    const subscriptions = await this.db
      .selectFrom('tenant_subscriptions')
      .select('id')
      .where('tenant_id', '=', tenantId)
      .execute();

    if (subscriptions.length === 0) return [];

    const subscriptionIds = subscriptions.map((s: any) => s.id);

    const historyRows = await this.db
      .selectFrom('subscription_history')
      .selectAll()
      .where('tenant_subscription_id', 'in', subscriptionIds)
      .orderBy('recorded_at', 'desc')
      .execute();

    return historyRows.map((h: any) => ({
      id: h.id,
      planId: h.plan_id,
      startDate: h.start_date,
      endDate: h.end_date,
      recordedAt: h.recorded_at,
    }));
  }
}
