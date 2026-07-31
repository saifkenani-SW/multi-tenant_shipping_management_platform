import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import { AuthModule } from '../auth/auth.module';

// CASL contributors and policies
import { PermissionAbility } from './casl/abilities/permission.ability';
import { RoleAbility } from './casl/abilities/role.ability';
import { PermissionCapabilityBuilder } from './casl/capabilities/permission-capability.builder';
import { RoleCapabilityBuilder } from './casl/capabilities/role-capability.builder';
import { PermissionPolicy } from './casl/policies/permission.policy';
import { RolePolicy } from './casl/policies/role.policy';
import { PermissionVisibilityScope } from './casl/scopes/permission-visibility.scope';
import { RoleVisibilityScope } from './casl/scopes/role-visibility.scope';

// Permission slice
import { PermissionQueryCriteriaBuilder } from './permission/builders/query/permission-query-criteria.builder';
import { PermissionPersistenceMapper } from './permission/mappers/persistence/permission.persistence.mapper';
import { PermissionResponseMapper } from './permission/mappers/response/permission.response.mapper';
import { PermissionController } from './permission/permission.controller';
import { PermissionCommandRepository } from './permission/repositories/permission.command.repository';
import { PermissionQueryRepository } from './permission/repositories/permission.query.repository';
import { PermissionQueryService } from './permission/services/permission.query.service';
import { PermissionSeederService } from './permission/services/permission.seeder.service';
import {
  PERMISSION_COMMAND_REPOSITORY_TOKEN,
  PERMISSION_QUERY_REPOSITORY_TOKEN,
} from './permission/tokens/permission-repository.tokens';

// Role slice
import { RoleQueryCriteriaBuilder } from './role/builders/query/role-query-criteria.builder';
import { RolePersistenceMapper } from './role/mappers/persistence/role.persistence.mapper';
import { RoleResponseMapper } from './role/mappers/response/role.response.mapper';
import { RoleCommandRepository } from './role/repositories/role.command.repository';
import { RoleQueryRepository } from './role/repositories/role.query.repository';
import { RoleController } from './role/role.controller';
import { RoleCommandService } from './role/services/role.command.service';
import { RoleQueryService } from './role/services/role.query.service';
import {
  ROLE_COMMAND_REPOSITORY_TOKEN,
  ROLE_QUERY_REPOSITORY_TOKEN,
} from './role/tokens/role-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    // مطلوب لـ PermissionCacheService: تعديل صلاحيات دور يبطل كاش الحُرّاس
    AuthModule,
    CaslModule.forFeature([RoleAbility, PermissionAbility]),
  ],
  controllers: [RoleController, PermissionController],
  providers: [
    // Repositories
    { provide: ROLE_COMMAND_REPOSITORY_TOKEN, useClass: RoleCommandRepository },
    { provide: ROLE_QUERY_REPOSITORY_TOKEN, useClass: RoleQueryRepository },
    {
      provide: PERMISSION_QUERY_REPOSITORY_TOKEN,
      useClass: PermissionQueryRepository,
    },
    {
      provide: PERMISSION_COMMAND_REPOSITORY_TOKEN,
      useClass: PermissionCommandRepository,
    },

    // Services
    { provide: 'IRoleCommandService', useClass: RoleCommandService },
    { provide: 'IRoleQueryService', useClass: RoleQueryService },
    { provide: 'IPermissionQueryService', useClass: PermissionQueryService },
    PermissionSeederService,

    // Builders
    RoleQueryCriteriaBuilder,
    PermissionQueryCriteriaBuilder,

    // Mappers
    RolePersistenceMapper,
    RoleResponseMapper,
    PermissionPersistenceMapper,
    PermissionResponseMapper,

    // Policies
    RolePolicy,
    PermissionPolicy,

    // CASL contributors
    RoleAbility,
    PermissionAbility,

    // Visibility & capabilities
    RoleVisibilityScope,
    RoleCapabilityBuilder,
    PermissionVisibilityScope,
    PermissionCapabilityBuilder,
  ],
  exports: [
    'IRoleCommandService',
    'IRoleQueryService',
    'IPermissionQueryService',
    ROLE_QUERY_REPOSITORY_TOKEN,
    PERMISSION_QUERY_REPOSITORY_TOKEN,
    RolePolicy,
    PermissionPolicy,
    RoleCapabilityBuilder,
    PermissionCapabilityBuilder,
    PermissionPersistenceMapper,
    PermissionResponseMapper,
  ],
})
export class AuthorizationModule {}
