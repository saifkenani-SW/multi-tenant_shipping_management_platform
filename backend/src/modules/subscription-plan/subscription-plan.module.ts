import { Module } from '@nestjs/common';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { SubscriptionPlanCommandService } from './services/subscription-plan.command.service';
import { SubscriptionPlanQueryService } from './services/subscription-plan.query.service';
import { SubscriptionPlanCommandRepository } from './repositories/subscription-plan.command.repository';
import { SubscriptionPlanQueryRepository } from './repositories/subscription-plan.query.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SubscriptionPlanController],
  providers: [
    {
      provide: 'ISubscriptionPlanCommandRepository',
      useClass: SubscriptionPlanCommandRepository,
    },
    {
      provide: 'ISubscriptionPlanQueryRepository',
      useClass: SubscriptionPlanQueryRepository,
    },
    {
      provide: 'ISubscriptionPlanCommandService',
      useClass: SubscriptionPlanCommandService,
    },
    {
      provide: 'ISubscriptionPlanQueryService',
      useClass: SubscriptionPlanQueryService,
    },
  ],
  exports: ['ISubscriptionPlanCommandService', 'ISubscriptionPlanQueryService'],
})
export class SubscriptionPlanModule {}
