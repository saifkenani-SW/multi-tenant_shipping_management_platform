import { Module } from '@nestjs/common';
import { TenantController } from './presentation/controllers/tenant.controller';
import { TenantCommandService } from './application/services/tenant.command.service';
import { TenantQueryService } from './application/services/tenant.query.service';
import { TenantCommandRepository } from './infrastructure/repositories/tenant.command.repository';
import { TenantSettingsCommandRepository } from './infrastructure/repositories/tenant-settings.command.repository';
import { TenantQueryRepository } from './infrastructure/repositories/tenant.query.repository';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import {
  TenantAbility,
  TenantPolicy,
  TenantVisibilityScope,
} from './domain/authorization';
import { CreateTenantStrategy } from './domain/authorization/policies/strategies/create-tenant.strategy';
import { TenantStrategyRegistry } from './domain/authorization/policies/strategies/registry/tenant-strategy.registry';
import { UpdateTenantStrategy } from './domain/authorization/policies/strategies/update-tenant.strategy';
import { DeleteTenantStrategy } from './domain/authorization/policies/strategies/delete-tenant.strategy';
import { ViewTenantStrategy } from './domain/authorization/policies/strategies/view-tenant.strategy';
import { SuspendTenantStrategy } from './domain/authorization/policies/strategies/suspend-tenant.strategy';
import { ActivateTenantStrategy } from './domain/authorization/policies/strategies/activate-tenant.strategy';
import { ManageSubscriptionStrategy } from './domain/authorization/policies/strategies/manage-subscription.strategy';
import { TenantCapabilityBuilder } from './domain/authorization/capabilities/tenant-capability.builder';
import { TenantFacade } from './application/facades/tenant.facade';
import { TenantPersistenceMapper } from './infrastructure/mappers/tenant.persistence.mapper';
import { TenantResponseMapper } from './application/mappers/tenant.response.mapper';
import { TenantQueryCriteriaBuilder } from './application/builders/query/tenant-query-criteria.builder';

import { SubscriptionPlanModule } from '../subscription-plan/subscription-plan.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    CaslModule.forFeature([TenantAbility]),
    SubscriptionPlanModule,
    UserModule,
  ],
  controllers: [TenantController],
  providers: [
    // Repositories
    TenantCommandRepository,
    TenantSettingsCommandRepository,
    TenantQueryRepository,

    // Services
    TenantCommandService,
    TenantQueryService,

    // Facades
    TenantFacade,

    // Builders
    TenantQueryCriteriaBuilder,

    // Mappers
    TenantPersistenceMapper,
    TenantResponseMapper,

    // Authorization
    TenantPolicy,
    TenantStrategyRegistry,

    CreateTenantStrategy,
    UpdateTenantStrategy,
    DeleteTenantStrategy,
    ViewTenantStrategy,
    SuspendTenantStrategy,
    ActivateTenantStrategy,
    ManageSubscriptionStrategy,

    // CASL
    TenantAbility,

    // Visibility
    TenantVisibilityScope,
    TenantCapabilityBuilder,
  ],
  exports: [TenantFacade, TenantPolicy, TenantCapabilityBuilder],
})
export class TenantModule {}
