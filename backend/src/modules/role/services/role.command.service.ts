import { Inject, Injectable } from '@nestjs/common';

import { Transactional } from '../../../core/transaction';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { Authorize } from '../../../packages/authorization';
import { Policy } from '../../../packages/authorization/policy';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import { RoleAction, RolePolicy } from '../authorization';
import { ROLE_CACHE_KEYS } from '../constants/role.cache.constants';
import { CreateRoleDto } from '../dtos/requests/create-role.dto';
import { SetRolePermissionsDto } from '../dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from '../dtos/requests/update-role.dto';
import { DuplicateRoleNameException } from '../exceptions/duplicate-role-name.exception';
import { RoleInUseException } from '../exceptions/role-in-use.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { UnknownPermissionException } from '../exceptions/unknown-permission.exception';
import type { IRoleCommandRepository } from '../interfaces/role.command.repository.interface';
import { IRoleCommandService } from '../interfaces/role.command.service.interface';
import type { IRoleQueryRepository } from '../interfaces/role.query.repository.interface';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import {
  ROLE_COMMAND_REPOSITORY_TOKEN,
  ROLE_QUERY_REPOSITORY_TOKEN,
} from '../tokens/role-repository.tokens';

@Injectable()
export class RoleCommandService implements IRoleCommandService {
  constructor(
    @Inject(ROLE_COMMAND_REPOSITORY_TOKEN)
    private readonly roleCommandRepository: IRoleCommandRepository,
    @Inject(ROLE_QUERY_REPOSITORY_TOKEN)
    private readonly roleQueryRepository: IRoleQueryRepository,
    private readonly permissionCacheService: PermissionCacheService,
    private readonly requestContext: RequestContextService,
    // مطلوب بهذا الاسم تحديداً لأن @Transactional() يبحث عن this.prisma
    private readonly prisma: PrismaService,
  ) {}

  @CacheEvict({ keyPrefix: ROLE_CACHE_KEYS.LIST, allEntries: true })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.Create),
    payloadResolver: (dto: CreateRoleDto) => ({ dto }),
  })
  @Transactional()
  async createRole(dto: CreateRoleDto): Promise<string> {
    const tenantId = this.resolveTenantId();

    if (await this.roleQueryRepository.existsByName(tenantId, dto.name)) {
      throw new DuplicateRoleNameException(dto.name);
    }

    const role = await this.roleCommandRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description ?? null,
    });

    if (dto.permissionIds?.length) {
      await this.assertPermissionsExist(dto.permissionIds);
      await this.roleCommandRepository.setPermissions(
        role.id,
        dto.permissionIds,
      );
    }

    return role.id;
  }

  @CacheEvict({ keyPrefix: ROLE_CACHE_KEYS.LIST, allEntries: true })
  @CacheEvict({
    keyPrefix: ROLE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ROLE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.Update),
    payloadResolver: (roleId: string, dto: UpdateRoleDto) => ({ roleId, dto }),
  })
  async updateRole(id: string, dto: UpdateRoleDto): Promise<void> {
    const role = await this.roleQueryRepository.findById(id);

    if (!role) {
      throw new RoleNotFoundException();
    }

    if (
      dto.name &&
      dto.name !== role.name &&
      (await this.roleQueryRepository.existsByName(
        role.tenantId,
        dto.name,
        id,
      ))
    ) {
      throw new DuplicateRoleNameException(dto.name);
    }

    await this.roleCommandRepository.update(id, {
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });

    // تعطيل الدور يغيّر ما يستطيع حامله فعله، والحُرّاس تقرأ من كاش عمره ساعة.
    if (dto.isActive === false) {
      await this.permissionCacheService.invalidateRolePermissions(id);
    }
  }

  @CacheEvict({ keyPrefix: ROLE_CACHE_KEYS.LIST, allEntries: true })
  @CacheEvict({
    keyPrefix: ROLE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ROLE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.Delete),
    payloadResolver: (roleId: string) => ({ roleId }),
  })
  async deleteRole(id: string): Promise<void> {
    const role = await this.roleQueryRepository.findById(id);

    if (!role) {
      throw new RoleNotFoundException();
    }

    // الحذف يسقط assignment_role بالـ cascade فيسحب صلاحيات موظفين بصمت.
    const assignmentCount =
      await this.roleQueryRepository.countAssignments(id);

    if (assignmentCount > 0) {
      throw new RoleInUseException(assignmentCount);
    }

    await this.roleCommandRepository.delete(id);
    await this.permissionCacheService.invalidateRolePermissions(id);
  }

  @CacheEvict({
    keyPrefix: ROLE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ROLE_CACHE_KEYS.DETAILS, id],
  })
  @CacheEvict({ keyPrefix: ROLE_CACHE_KEYS.LIST, allEntries: true })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.ManagePermissions),
    payloadResolver: (roleId: string, dto: SetRolePermissionsDto) => ({
      roleId,
      dto,
    }),
  })
  @Transactional()
  async setRolePermissions(
    id: string,
    dto: SetRolePermissionsDto,
  ): Promise<void> {
    const role = await this.roleQueryRepository.findById(id);

    if (!role) {
      throw new RoleNotFoundException();
    }

    await this.assertPermissionsExist(dto.permissionIds);
    await this.roleCommandRepository.setPermissions(id, dto.permissionIds);

    // بدون هذا السطر تبقى الصلاحيات القديمة سارية حتى ساعة كاملة.
    await this.permissionCacheService.invalidateRolePermissions(id);
  }

  /**
   * صلاحية غير موجودة في الكتالوج تعني امتيازاً لا يقابله فحص في الكود.
   */
  private async assertPermissionsExist(
    permissionIds: readonly string[],
  ): Promise<void> {
    const existing =
      await this.roleCommandRepository.findExistingPermissionIds(permissionIds);

    const existingSet = new Set(existing);
    const missing = permissionIds.filter((id) => !existingSet.has(id));

    if (missing.length > 0) {
      throw new UnknownPermissionException(missing);
    }
  }

  /**
   * الدور يُنشأ دائماً داخل tenant. مدير المنصة لا يحمل tenantId، فلا
   * يستطيع الإنشاء دون تحديد سياق — وهذا مقصود حتى لا يُنشأ دور يتيم.
   */
  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
