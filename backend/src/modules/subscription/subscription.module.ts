import { Module } from '@nestjs/common';
import { SubscriptionController } from './presentation/controllers/subscription.controller';
import { CreateSubscriptionPlanUseCase } from './application/use-cases/create-subscription-plan.use-case';
import { SubscribeTenantUseCase } from './application/use-cases/subscribe-tenant.use-case';
import { PrismaSubscriptionPlanRepository } from './infrastructure/persistence/prisma-subscription-plan.repository';
import { PrismaTenantSubscriptionRepository } from './infrastructure/persistence/prisma-tenant-subscription.repository';
import { KyselySubscriptionQueryService } from './infrastructure/query-services/kysely-subscription.query-service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    CreateSubscriptionPlanUseCase,
    SubscribeTenantUseCase,
    {
      provide: 'ISubscriptionPlanRepository',
      useClass: PrismaSubscriptionPlanRepository,
    },
    {
      provide: 'ITenantSubscriptionRepository',
      useClass: PrismaTenantSubscriptionRepository,
    },
    {
      provide: 'ISubscriptionPlanQueryService',
      useClass: KyselySubscriptionQueryService,
    },
    {
      provide: 'ITenantSubscriptionQueryService',
      useClass: KyselySubscriptionQueryService,
    },
  ],
})
export class SubscriptionModule {}
