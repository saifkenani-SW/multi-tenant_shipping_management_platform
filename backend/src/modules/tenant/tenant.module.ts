import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantCommandService } from './services/tenant.command.service';
import { TenantQueryService } from './services/tenant.query.service';
import { TenantCommandRepository } from './repositories/tenant.command.repository';
import { TenantQueryRepository } from './repositories/tenant.query.repository';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import {
  TenantAbility,
  TenantPolicy,
  TenantVisibilityScope,
} from './authorization';
import { CreateTenantStrategy } from './authorization/policies/strategies/create-tenant.strategy';
import { TenantStrategyRegistry } from './authorization/policies/strategies/registry/tenant-strategy.registry';
import { UpdateTenantStrategy } from './authorization/policies/strategies/update-tenant.strategy';
import { DeleteTenantStrategy } from './authorization/policies/strategies/delete-tenant.strategy';
import { ViewTenantStrategy } from './authorization/policies/strategies/view-tenant.strategy';
import { SuspendTenantStrategy } from './authorization/policies/strategies/suspend-tenant.strategy';
import { ActivateTenantStrategy } from './authorization/policies/strategies/activate-tenant.strategy';
import { TenantCapabilityBuilder } from './authorization/capabilities/tenant-capability.builder';
import {
  TENANT_COMMAND_REPOSITORY_TOKEN,
  TENANT_QUERY_REPOSITORY_TOKEN,
} from './tokens/tenant-repository.tokens';
import { TenantPersistenceMapper } from './mappers/persistence/tenant.persistence.mapper';
import { TenantResponseMapper } from './mappers/response/tenant.response.mapper';
import { TenantQueryCriteriaBuilder } from './builders/query/tenant-query-criteria.builder';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    CaslModule.forFeature([TenantAbility]),
  ],
  controllers: [TenantController],
  providers: [
    // Repositories
    {
      provide: TENANT_COMMAND_REPOSITORY_TOKEN,
      useClass: TenantCommandRepository,
    },
    {
      provide: TENANT_QUERY_REPOSITORY_TOKEN,
      useClass: TenantQueryRepository,
    },

    // Services
    {
      provide: 'ITenantCommandService',
      useClass: TenantCommandService,
    },
    {
      provide: 'ITenantQueryService',
      useClass: TenantQueryService,
    },

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

    // CASL
    TenantAbility,

    // Visibility
    TenantVisibilityScope,
    TenantCapabilityBuilder,
  ],
  exports: [
    'ITenantCommandService',
    'ITenantQueryService',
    TenantPolicy,
    TenantCapabilityBuilder,
  ],
})
export class TenantModule {}
