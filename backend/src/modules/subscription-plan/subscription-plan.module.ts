import { Module } from '@nestjs/common';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { SubscriptionPlanCommandService } from './services/subscription-plan.command.service';
import { SubscriptionPlanQueryService } from './services/subscription-plan.query.service';
import { SubscriptionPlanCommandRepository } from './repositories/subscription-plan.command.repository';
import { SubscriptionPlanQueryRepository } from './repositories/subscription-plan.query.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import {
  SUBSCRIPTION_PLAN_COMMAND_REPOSITORY,
  SUBSCRIPTION_PLAN_QUERY_REPOSITORY,
} from './tokens/subscription-plan-repository.tokens';
import {
  SUBSCRIPTION_PLAN_COMMAND_SERVICE,
  SUBSCRIPTION_PLAN_QUERY_SERVICE,
} from './tokens/subscription-plan-service.tokens';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SubscriptionPlanController],
  providers: [
    {
      provide: SUBSCRIPTION_PLAN_COMMAND_REPOSITORY,
      useClass: SubscriptionPlanCommandRepository,
    },
    {
      provide: SUBSCRIPTION_PLAN_QUERY_REPOSITORY,
      useClass: SubscriptionPlanQueryRepository,
    },
    {
      provide: SUBSCRIPTION_PLAN_COMMAND_SERVICE,
      useClass: SubscriptionPlanCommandService,
    },
    {
      provide: SUBSCRIPTION_PLAN_QUERY_SERVICE,
      useClass: SubscriptionPlanQueryService,
    },
  ],
  exports: [SUBSCRIPTION_PLAN_COMMAND_SERVICE, SUBSCRIPTION_PLAN_QUERY_SERVICE],
})
export class SubscriptionPlanModule {}
