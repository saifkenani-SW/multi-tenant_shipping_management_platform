import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RoleController } from './role.controller';
import { PermissionController } from './permission.controller';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { PermissionSeederService } from './services/permission-seeder.service';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePersistenceMapper } from './mappers/persistence/role.persistence.mapper';
import { PermissionPersistenceMapper } from './mappers/persistence/permission.persistence.mapper';
import { RoleResponseMapper } from './mappers/response/role.response.mapper';
import { PermissionResponseMapper } from './mappers/response/permission.response.mapper';
import { AuthorizationModuleFacade } from './facades/authorization-module.facade';

@Module({
  imports: [AuthModule],
  controllers: [RoleController, PermissionController],
  providers: [
    RoleService,
    PermissionService,
    PermissionSeederService,
    RoleRepository,
    PermissionRepository,
    RolePersistenceMapper,
    PermissionPersistenceMapper,
    RoleResponseMapper,
    PermissionResponseMapper,
    AuthorizationModuleFacade,
  ],
  exports: [
    RoleService,
    PermissionService,
    PermissionSeederService,
    RoleRepository,
    PermissionRepository,
    AuthorizationModuleFacade,
  ],
})
export class AuthorizationModule {}
