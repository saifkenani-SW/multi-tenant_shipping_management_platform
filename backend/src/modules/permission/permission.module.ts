import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import {
  PermissionAbility,
  PermissionPolicy,
  PermissionVisibilityScope,
} from './authorization';
import { PermissionCapabilityBuilder } from './authorization/capabilities/permission-capability.builder';
import { PermissionStrategyRegistry } from './authorization/policies/strategies/registry/permission-strategy.registry';
import { ViewPermissionStrategy } from './authorization/policies/strategies/view-permission.strategy';
import { PermissionQueryCriteriaBuilder } from './builders/query/permission-query-criteria.builder';
import { PermissionPersistenceMapper } from './mappers/persistence/permission.persistence.mapper';
import { PermissionResponseMapper } from './mappers/response/permission.response.mapper';
import { PermissionController } from './permission.controller';
import { PermissionCommandRepository } from './repositories/permission.command.repository';
import { PermissionQueryRepository } from './repositories/permission.query.repository';
import { PermissionQueryService } from './services/permission.query.service';
import { PermissionSeederService } from './services/permission.seeder.service';
import {
  PERMISSION_COMMAND_REPOSITORY_TOKEN,
  PERMISSION_QUERY_REPOSITORY_TOKEN,
} from './tokens/permission-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    CaslModule.forFeature([PermissionAbility]),
  ],
  controllers: [PermissionController],
  providers: [
    // Repositories
    {
      provide: PERMISSION_QUERY_REPOSITORY_TOKEN,
      useClass: PermissionQueryRepository,
    },
    {
      provide: PERMISSION_COMMAND_REPOSITORY_TOKEN,
      useClass: PermissionCommandRepository,
    },

    // Services
    {
      provide: 'IPermissionQueryService',
      useClass: PermissionQueryService,
    },
    PermissionSeederService,

    // Builders
    PermissionQueryCriteriaBuilder,

    // Mappers
    PermissionPersistenceMapper,
    PermissionResponseMapper,

    // Authorization
    PermissionPolicy,
    PermissionStrategyRegistry,
    ViewPermissionStrategy,

    // CASL
    PermissionAbility,

    // Visibility
    PermissionVisibilityScope,
    PermissionCapabilityBuilder,
  ],
  exports: [
    'IPermissionQueryService',
    PERMISSION_QUERY_REPOSITORY_TOKEN,
    PermissionPolicy,
    PermissionCapabilityBuilder,
    PermissionPersistenceMapper,
    PermissionResponseMapper,
  ],
})
export class PermissionModule {}
