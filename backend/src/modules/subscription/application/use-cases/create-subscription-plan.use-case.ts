import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateSubscriptionPlanCommand } from '../dtos/create-subscription-plan.command';
import type { ISubscriptionPlanRepository } from '../../domain/repositories/subscription-plan.repository.interface';
import { SubscriptionPlan } from '../../domain/aggregates/subscription-plan.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';

@Injectable()
export class CreateSubscriptionPlanUseCase {
  constructor(
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async execute(command: CreateSubscriptionPlanCommand): Promise<string> {
    const planId = randomUUID();

    // Note: In a real system, you might want to check for duplicate plan names,
    // but the requirements state plans are immutable and can be recreated,
    // so we just construct the aggregate.

    const price = new Money(command.priceAmount, command.priceCurrency);

    const plan = SubscriptionPlan.create(
      planId,
      command.name,
      price,
      command.billingCycle,
      command.features,
    );

    await this.planRepository.save(plan);

    return plan.id;
  }
}
