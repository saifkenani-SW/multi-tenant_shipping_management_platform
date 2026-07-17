import { Injectable } from '@nestjs/common';
import { ISubscriptionPlanRepository } from '../../domain/repositories/subscription-plan.repository.interface';
import { SubscriptionPlan } from '../../domain/aggregates/subscription-plan.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';
import {
  BillingCycle,
  SubscriptionPlanStatus,
} from '../../domain/value-objects/subscription.enums';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class PrismaSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(plan: SubscriptionPlan): Promise<void> {
    await this.prisma.subscription_plan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        price_monthly: plan.price.amount,
        is_active: plan.status === SubscriptionPlanStatus.ACTIVE,
        created_at: plan.createdAt,
        updated_at: plan.updatedAt,
      },
      update: {
        is_active: plan.status === SubscriptionPlanStatus.ACTIVE,
        updated_at: plan.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const raw = await this.prisma.subscription_plan.findUnique({
      where: { id },
    });
    if (!raw) return null;

    return SubscriptionPlan.reconstitute({
      id: raw.id,
      name: raw.name,
      price: new Money(Number(raw.price_monthly), 'USD'),
      billingCycle: BillingCycle.MONTHLY,
      features: [],
      status: raw.is_active
        ? SubscriptionPlanStatus.ACTIVE
        : SubscriptionPlanStatus.ARCHIVED,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
