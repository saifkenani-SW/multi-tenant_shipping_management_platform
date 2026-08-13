import { Injectable } from '@nestjs/common';
import { Pagination } from '../../../common/pagination';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { Transactional } from '../../../packages/transaction';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';

import { CreateRoleDto } from '../dtos/requests/create-role.dto';
import { RoleQueryDto } from '../dtos/requests/role-query.dto';
import { SetRolePermissionsDto } from '../dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from '../dtos/requests/update-role.dto';
import { RoleDetailsDto } from '../dtos/responses/role-details.dto';
import { PaginatedRoleListDto } from '../dtos/responses/role-list.dto';

import { DuplicateRoleNameException } from '../exceptions/duplicate-role-name.exception';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import { RoleInUseException } from '../exceptions/role-in-use.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { UnknownPermissionException } from '../exceptions/unknown-permission.exception';

import { RoleResponseMapper } from '../mappers/response/role.response.mapper';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionCacheService: PermissionCacheService,
    private readonly requestContext: RequestContextService,
    private readonly roleResponseMapper: RoleResponseMapper,
  ) {}

  @CacheEvict({ keyPrefix: 'roles:list', allEntries: true })
  @Transactional()
  async createRole(dto: CreateRoleDto): Promise<string> {
    const tenantId = this.resolveTenantId();

    if (await this.roleRepository.existsByName(tenantId, dto.name)) {
      throw new DuplicateRoleNameException(dto.name);
    }

    const role = await this.roleRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description ?? null,
    });

    if (dto.permissionIds?.length) {
      await this.assertPermissionsExist(dto.permissionIds);
      await this.roleRepository.setPermissions(role.id, dto.permissionIds);
    }

    return role.id;
  }

  @CacheEvict({ keyPrefix: 'roles:list', allEntries: true })
  @CacheEvict({
    keyPrefix: 'roles:details',
    keyBuilder: (id: string) => ['roles', 'details', id],
  })
  async updateRole(id: string, dto: UpdateRoleDto): Promise<void> {
    const tenantId = this.resolveTenantId();
    const role = await this.roleRepository.findById(id);

    if (!role || role.tenantId !== tenantId) {
      throw new RoleNotFoundException();
    }

    if (
      dto.name &&
      dto.name !== role.name &&
      (await this.roleRepository.existsByName(role.tenantId, dto.name, id))
    ) {
      throw new DuplicateRoleNameException(dto.name);
    }

    await this.roleRepository.update(id, {
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });

    if (dto.isActive === false) {
      await this.permissionCacheService.invalidateRolePermissions(id);
    }
  }

  @CacheEvict({ keyPrefix: 'roles:list', allEntries: true })
  @CacheEvict({
    keyPrefix: 'roles:details',
    keyBuilder: (id: string) => ['roles', 'details', id],
  })
  async deleteRole(id: string): Promise<void> {
    const tenantId = this.resolveTenantId();
    const role = await this.roleRepository.findById(id);

    if (!role || role.tenantId !== tenantId) {
      throw new RoleNotFoundException();
    }

    const assignmentCount = await this.roleRepository.countAssignments(id);

    if (assignmentCount > 0) {
      throw new RoleInUseException(assignmentCount);
    }

    await this.roleRepository.delete(id);
    await this.permissionCacheService.invalidateRolePermissions(id);
  }

  @CacheEvict({
    keyPrefix: 'roles:details',
    keyBuilder: (id: string) => ['roles', 'details', id],
  })
  @CacheEvict({ keyPrefix: 'roles:list', allEntries: true })
  @Transactional()
  async setRolePermissions(
    id: string,
    dto: SetRolePermissionsDto,
  ): Promise<void> {
    const tenantId = this.resolveTenantId();
    const role = await this.roleRepository.findById(id);

    if (!role || role.tenantId !== tenantId) {
      throw new RoleNotFoundException();
    }

    await this.assertPermissionsExist(dto.permissionIds);
    await this.roleRepository.setPermissions(id, dto.permissionIds);
    await this.permissionCacheService.invalidateRolePermissions(id);
  }

  async findRoles(query: RoleQueryDto): Promise<PaginatedRoleListDto> {
    const tenantId = this.resolveTenantId();
    const [items, total] = await this.roleRepository.findMany(query, tenantId);

    const pagination = new Pagination({
      page: query.page || 1,
      limit: query.limit || 10,
    });

    return this.roleResponseMapper.toPaginatedListDto(items, total, pagination);
  }

  async getRoleDetails(id: string): Promise<RoleDetailsDto> {
    const tenantId = this.resolveTenantId();
    const role = await this.roleRepository.findByIdWithPermissions(id);

    if (!role || role.tenantId !== tenantId) {
      throw new RoleNotFoundException();
    }

    return this.roleResponseMapper.toDetailsDto(role);
  }

  private async assertPermissionsExist(
    permissionIds: readonly string[],
  ): Promise<void> {
    const existing =
      await this.roleRepository.findExistingPermissionIds(permissionIds);

    const existingSet = new Set(existing);
    const missing = permissionIds.filter((id) => !existingSet.has(id));

    if (missing.length > 0) {
      throw new UnknownPermissionException(missing);
    }
  }

  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
