import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import { AuthModule } from '../auth/auth.module';
import { PermissionModule } from '../permission/permission.module';
import {
  RoleAbility,
  RolePolicy,
  RoleVisibilityScope,
} from './authorization';
import { RoleCapabilityBuilder } from './authorization/capabilities/role-capability.builder';
import { CreateRoleStrategy } from './authorization/policies/strategies/create-role.strategy';
import { DeleteRoleStrategy } from './authorization/policies/strategies/delete-role.strategy';
import { ManageRolePermissionsStrategy } from './authorization/policies/strategies/manage-role-permissions.strategy';
import { RoleStrategyRegistry } from './authorization/policies/strategies/registry/role-strategy.registry';
import { UpdateRoleStrategy } from './authorization/policies/strategies/update-role.strategy';
import { ViewRoleStrategy } from './authorization/policies/strategies/view-role.strategy';
import { RoleQueryCriteriaBuilder } from './builders/query/role-query-criteria.builder';
import { RolePersistenceMapper } from './mappers/persistence/role.persistence.mapper';
import { RoleResponseMapper } from './mappers/response/role.response.mapper';
import { RoleCommandRepository } from './repositories/role.command.repository';
import { RoleQueryRepository } from './repositories/role.query.repository';
import { RoleController } from './role.controller';
import { RoleCommandService } from './services/role.command.service';
import { RoleQueryService } from './services/role.query.service';
import {
  ROLE_COMMAND_REPOSITORY_TOKEN,
  ROLE_QUERY_REPOSITORY_TOKEN,
} from './tokens/role-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    // مطلوب لـ PermissionCacheService: تعديل صلاحيات دور يبطل كاش الحُرّاس
    AuthModule,
    // مطلوب لمحوّل استجابة الصلاحيات ولمحوّل الثبات المشترك
    PermissionModule,
    CaslModule.forFeature([RoleAbility]),
  ],
  controllers: [RoleController],
  providers: [
    // Repositories
    {
      provide: ROLE_COMMAND_REPOSITORY_TOKEN,
      useClass: RoleCommandRepository,
    },
    {
      provide: ROLE_QUERY_REPOSITORY_TOKEN,
      useClass: RoleQueryRepository,
    },

    // Services
    {
      provide: 'IRoleCommandService',
      useClass: RoleCommandService,
    },
    {
      provide: 'IRoleQueryService',
      useClass: RoleQueryService,
    },

    // Builders
    RoleQueryCriteriaBuilder,

    // Mappers
    RolePersistenceMapper,
    RoleResponseMapper,

    // Authorization
    RolePolicy,
    RoleStrategyRegistry,

    CreateRoleStrategy,
    ViewRoleStrategy,
    UpdateRoleStrategy,
    DeleteRoleStrategy,
    ManageRolePermissionsStrategy,

    // CASL
    RoleAbility,

    // Visibility
    RoleVisibilityScope,
    RoleCapabilityBuilder,
  ],
  exports: [
    'IRoleCommandService',
    'IRoleQueryService',
    ROLE_QUERY_REPOSITORY_TOKEN,
    RolePolicy,
    RoleCapabilityBuilder,
  ],
})
export class RoleModule {}
