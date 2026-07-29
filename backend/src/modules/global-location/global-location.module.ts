import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import {
  GlobalLocationAbility,
  GlobalLocationPolicy,
  GlobalLocationVisibilityScope,
} from './authorization';
import { GlobalLocationCapabilityBuilder } from './authorization/capabilities/global-location-capability.builder';
import { CreateGlobalLocationStrategy } from './authorization/policies/strategies/create-global-location.strategy';
import { DeleteGlobalLocationStrategy } from './authorization/policies/strategies/delete-global-location.strategy';
import { GlobalLocationStrategyRegistry } from './authorization/policies/strategies/registry/global-location-strategy.registry';
import { UpdateGlobalLocationStrategy } from './authorization/policies/strategies/update-global-location.strategy';
import { ViewGlobalLocationStrategy } from './authorization/policies/strategies/view-global-location.strategy';
import { GlobalLocationQueryCriteriaBuilder } from './builders/query/global-location-query-criteria.builder';
import { GlobalLocationController } from './global-location.controller';
import { GlobalLocationPersistenceMapper } from './mappers/persistence/global-location.persistence.mapper';
import { GlobalLocationResponseMapper } from './mappers/response/global-location.response.mapper';
import { GlobalLocationCommandRepository } from './repositories/global-location.command.repository';
import { GlobalLocationQueryRepository } from './repositories/global-location.query.repository';
import { GlobalLocationCommandService } from './services/global-location.command.service';
import { GlobalLocationQueryService } from './services/global-location.query.service';
import {
  GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN,
  GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
} from './tokens/global-location-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    CaslModule.forFeature([GlobalLocationAbility]),
  ],
  controllers: [GlobalLocationController],
  providers: [
    // Repositories
    {
      provide: GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN,
      useClass: GlobalLocationCommandRepository,
    },
    {
      provide: GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
      useClass: GlobalLocationQueryRepository,
    },

    // Services
    {
      provide: 'IGlobalLocationCommandService',
      useClass: GlobalLocationCommandService,
    },
    {
      provide: 'IGlobalLocationQueryService',
      useClass: GlobalLocationQueryService,
    },

    // Builders
    GlobalLocationQueryCriteriaBuilder,

    // Mappers
    GlobalLocationPersistenceMapper,
    GlobalLocationResponseMapper,

    // Authorization
    GlobalLocationPolicy,
    GlobalLocationStrategyRegistry,

    CreateGlobalLocationStrategy,
    ViewGlobalLocationStrategy,
    UpdateGlobalLocationStrategy,
    DeleteGlobalLocationStrategy,

    // CASL
    GlobalLocationAbility,

    // Visibility
    GlobalLocationVisibilityScope,
    GlobalLocationCapabilityBuilder,
  ],
  exports: [
    'IGlobalLocationCommandService',
    'IGlobalLocationQueryService',
    GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
    GlobalLocationPolicy,
    GlobalLocationCapabilityBuilder,
  ],
})
export class GlobalLocationModule {}
