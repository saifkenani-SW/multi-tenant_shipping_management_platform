import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SubscribeTenantCommand } from '../dtos/subscribe-tenant.command';
import type { ITenantSubscriptionRepository } from '../../domain/repositories/tenant-subscription.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/repositories/subscription-plan.repository.interface';
import { TenantSubscription } from '../../domain/aggregates/tenant-subscription.aggregate';
import { TenantAlreadySubscribedException } from '../../domain/exceptions/subscription.exceptions';

@Injectable()
export class SubscribeTenantUseCase {
  constructor(
    @Inject('ITenantSubscriptionRepository')
    private readonly subscriptionRepository: ITenantSubscriptionRepository,
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async execute(command: SubscribeTenantCommand): Promise<string> {
    // 1. Validate plan exists
    const plan = await this.planRepository.findById(command.planId);
    if (!plan) {
      throw new Error(`Subscription Plan with ID ${command.planId} not found`); // Should be Domain Exception
    }

    // 2. Validate tenant is not already subscribed
    const existingSubscription =
      await this.subscriptionRepository.findCurrentByTenantId(command.tenantId);
    if (existingSubscription) {
      throw new TenantAlreadySubscribedException(command.tenantId);
    }

    // 3. Create the Domain Aggregate
    const subscriptionId = randomUUID();
    const historyId = randomUUID();

    const subscription = TenantSubscription.subscribe(
      subscriptionId,
      command.tenantId,
      command.planId,
      new Date(command.startDate),
      new Date(command.endDate),
      historyId,
    );

    // 4. Save via Write Repository
    await this.subscriptionRepository.save(subscription);

    return subscription.id;
  }
}
