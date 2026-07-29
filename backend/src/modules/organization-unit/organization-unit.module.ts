import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import {
  OrganizationUnitAbility,
  OrganizationUnitPolicy,
  OrganizationUnitVisibilityScope,
} from './authorization';
import { OrganizationUnitCapabilityBuilder } from './authorization/capabilities/organization-unit-capability.builder';
import { CreateOrganizationUnitStrategy } from './authorization/policies/strategies/create-organization-unit.strategy';
import { DeleteOrganizationUnitStrategy } from './authorization/policies/strategies/delete-organization-unit.strategy';
import { ManageCoverageStrategy } from './authorization/policies/strategies/manage-coverage.strategy';
import { OrganizationUnitStrategyRegistry } from './authorization/policies/strategies/registry/organization-unit-strategy.registry';
import { UpdateOrganizationUnitStrategy } from './authorization/policies/strategies/update-organization-unit.strategy';
import { ViewOrganizationUnitStrategy } from './authorization/policies/strategies/view-organization-unit.strategy';
import { OrganizationUnitQueryCriteriaBuilder } from './builders/query/organization-unit-query-criteria.builder';
import { OrganizationUnitPersistenceMapper } from './mappers/persistence/organization-unit.persistence.mapper';
import { OrganizationUnitResponseMapper } from './mappers/response/organization-unit.response.mapper';
import { OrganizationUnitController } from './organization-unit.controller';
import { OrganizationUnitCommandRepository } from './repositories/organization-unit.command.repository';
import { OrganizationUnitQueryRepository } from './repositories/organization-unit.query.repository';
import { OrganizationUnitCommandService } from './services/organization-unit.command.service';
import { OrganizationUnitQueryService } from './services/organization-unit.query.service';
import {
  ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN,
  ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
} from './tokens/organization-unit-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    CaslModule.forFeature([OrganizationUnitAbility]),
  ],
  controllers: [OrganizationUnitController],
  providers: [
    // Repositories
    {
      provide: ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN,
      useClass: OrganizationUnitCommandRepository,
    },
    {
      provide: ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
      useClass: OrganizationUnitQueryRepository,
    },

    // Services
    {
      provide: 'IOrganizationUnitCommandService',
      useClass: OrganizationUnitCommandService,
    },
    {
      provide: 'IOrganizationUnitQueryService',
      useClass: OrganizationUnitQueryService,
    },

    // Builders
    OrganizationUnitQueryCriteriaBuilder,

    // Mappers
    OrganizationUnitPersistenceMapper,
    OrganizationUnitResponseMapper,

    // Authorization
    OrganizationUnitPolicy,
    OrganizationUnitStrategyRegistry,

    CreateOrganizationUnitStrategy,
    ViewOrganizationUnitStrategy,
    UpdateOrganizationUnitStrategy,
    DeleteOrganizationUnitStrategy,
    ManageCoverageStrategy,

    // CASL
    OrganizationUnitAbility,

    // Visibility
    OrganizationUnitVisibilityScope,
    OrganizationUnitCapabilityBuilder,
  ],
  exports: [
    'IOrganizationUnitCommandService',
    'IOrganizationUnitQueryService',
    ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
    OrganizationUnitPolicy,
    OrganizationUnitCapabilityBuilder,
  ],
})
export class OrganizationUnitModule {}
