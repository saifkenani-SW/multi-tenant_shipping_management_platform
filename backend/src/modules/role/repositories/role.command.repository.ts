import { Injectable } from '@nestjs/common';

import { TransactionalPrismaService } from '../../../packages/transaction';
import {
  CreateRoleRepositoryData,
  UpdateRoleRepositoryData,
} from '../contracts/persistence/role-repository-data.types';
import { Role } from '../domain/role.entity';
import { IRoleCommandRepository } from '../interfaces/role.command.repository.interface';
import { RolePersistenceMapper } from '../mappers/persistence/role.persistence.mapper';

@Injectable()
export class RoleCommandRepository implements IRoleCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly rolePersistenceMapper: RolePersistenceMapper,
  ) {}

  async create(data: CreateRoleRepositoryData): Promise<Role> {
    const role = await this.prisma.client.role.create({
      data: {
        tenant_id: data.tenantId,
        name: data.name,
        description: data.description ?? null,
      },
    });

    return this.rolePersistenceMapper.toDomain(role);
  }

  async update(id: string, data: UpdateRoleRepositoryData): Promise<void> {
    await this.prisma.client.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.isActive,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.role.delete({ where: { id } });
  }

  /**
   * استبدال كامل: نحذف ثم ندرج. يجب أن يجري داخل @Transactional() وإلا
   * تركنا الدور بلا صلاحيات إذا فشل الإدراج.
   */
  async setPermissions(
    id: string,
    permissionIds: readonly string[],
  ): Promise<void> {
    await this.prisma.client.role_permission.deleteMany({
      where: { role_id: id },
    });

    if (permissionIds.length === 0) {
      return;
    }

    await this.prisma.client.role_permission.createMany({
      data: permissionIds.map((permissionId) => ({
        role_id: id,
        permission_id: permissionId,
      })),
      skipDuplicates: true,
    });
  }

  async findExistingPermissionIds(
    permissionIds: readonly string[],
  ): Promise<string[]> {
    if (permissionIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.client.permission.findMany({
      where: { id: { in: [...permissionIds] } },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }
}
