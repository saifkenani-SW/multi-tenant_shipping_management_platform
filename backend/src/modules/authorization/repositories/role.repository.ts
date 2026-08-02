import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import { CacheStrategy } from '../../../infrastructure/cache/decorators/cache-strategy.enum';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { TransactionalPrismaService } from '../../../packages/transaction';
import { Role } from '../domain/role.entity';
import { RoleSearchField } from '../domain/enums/role.enum';
import { RolePersistenceMapper } from '../mappers/persistence/role.persistence.mapper';
import { PermissionPersistenceMapper } from '../mappers/persistence/permission.persistence.mapper';
import { RoleQueryDto } from '../dtos/requests/role-query.dto';

const ROLE_COLUMNS = [
  'id',
  'tenant_id',
  'name',
  'description',
  'is_active',
  'created_at',
] as const;

export interface CreateRoleData {
  tenantId: string;
  name: string;
  description?: string | null;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class RoleRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly rolePersistenceMapper: RolePersistenceMapper,
    private readonly permissionPersistenceMapper: PermissionPersistenceMapper,
  ) {}

  async create(data: CreateRoleData): Promise<Role> {
    const role = await this.prisma.client.role.create({
      data: {
        tenant_id: data.tenantId,
        name: data.name,
        description: data.description ?? null,
      },
    });

    return this.rolePersistenceMapper.toDomain(role);
  }

  async update(id: string, data: UpdateRoleData): Promise<void> {
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

  async findById(id: string): Promise<Role | null> {
    const role = await this.selectRoleById(id);

    if (!role) return null;

    return this.rolePersistenceMapper.toDomain(role);
  }

  @Cacheable({
    ttl: 3600,
    keyBuilder: (id: string) => ['roles', 'details', id],
  })
  async findByIdWithPermissions(id: string): Promise<Role | null> {
    const role = await this.selectRoleById(id);

    if (!role) return null;

    const permissions = await this.kysely
      .selectFrom('permission')
      .innerJoin(
        'role_permission',
        'role_permission.permission_id',
        'permission.id',
      )
      .select([
        'permission.id',
        'permission.name',
        'permission.resource',
        'permission.action',
        'permission.description',
      ])
      .where('role_permission.role_id', '=', id)
      .orderBy('permission.resource', 'asc')
      .orderBy('permission.name', 'asc')
      .execute();

    return this.rolePersistenceMapper.toDomain(
      role,
      permissions.map((permission) =>
        this.permissionPersistenceMapper.toDomain(permission),
      ),
    );
  }

  @Cacheable({
    strategy: CacheStrategy.MANY,
    keyPrefix: 'roles:details',
    ids: (ids: string[]) => ids,
    loader: (args: any[], missingIds: string[]) => [missingIds],
    ttl: 3600,
  })
  async findByIdsWithPermissions(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];

    const roles = await this.kysely
      .selectFrom('role')
      .select(ROLE_COLUMNS)
      .where('id', 'in', ids)
      .execute();

    if (roles.length === 0) return [];

    const permissions = await this.kysely
      .selectFrom('permission')
      .innerJoin(
        'role_permission',
        'role_permission.permission_id',
        'permission.id',
      )
      .select([
        'permission.id',
        'permission.name',
        'permission.resource',
        'permission.action',
        'permission.description',
        'role_permission.role_id',
      ])
      .where('role_permission.role_id', 'in', ids)
      .execute();

    const permissionsByRole = new Map<string, any[]>();
    for (const p of permissions) {
      if (!permissionsByRole.has(p.role_id)) {
        permissionsByRole.set(p.role_id, []);
      }
      permissionsByRole.get(p.role_id)!.push(p);
    }

    return roles.map((role) => {
      const rolePerms = permissionsByRole.get(role.id) || [];
      return this.rolePersistenceMapper.toDomain(
        role,
        rolePerms.map((permission) =>
          this.permissionPersistenceMapper.toDomain(permission),
        ),
      );
    });
  }

  async findMany(
    queryDto: RoleQueryDto,
    tenantId?: string,
  ): Promise<[Role[], number]> {
    let query = this.kysely.selectFrom('role').select(ROLE_COLUMNS);
    let countQuery = this.kysely
      .selectFrom('role')
      .select((eb) => eb.fn.count('id').as('count'));

    if (queryDto.search) {
      const field =
        queryDto.searchType === RoleSearchField.DESCRIPTION
          ? 'description'
          : 'name';
      const keyword = `%${queryDto.search}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (queryDto.isActive !== undefined) {
      query = query.where('is_active', '=', queryDto.isActive);
      countQuery = countQuery.where('is_active', '=', queryDto.isActive);
    }

    if (tenantId) {
      query = query.where('tenant_id', '=', tenantId);
      countQuery = countQuery.where('tenant_id', '=', tenantId);
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    query = query.orderBy('created_at', 'desc').offset(skip).limit(limit);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const permissionCounts = await this.countPermissionsByRoleIds(
      items.map((role) => role.id),
    );

    const mappedItems = items.map((role) =>
      this.rolePersistenceMapper.toDomain(
        role,
        new Array(permissionCounts.get(role.id) ?? 0).fill(
          undefined,
        ) as never[],
      ),
    );

    return [mappedItems, total];
  }

  async countAssignments(id: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('assignment_role')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('role_id', '=', id)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async existsByName(
    tenantId: string,
    name: string,
    excludeRoleId?: string,
  ): Promise<boolean> {
    let query = this.kysely
      .selectFrom('role')
      .select('id')
      .where('tenant_id', '=', tenantId)
      .where('name', '=', name);

    if (excludeRoleId) {
      query = query.where('id', '!=', excludeRoleId);
    }

    const existing = await query.executeTakeFirst();

    return Boolean(existing);
  }

  private async selectRoleById(id: string) {
    return this.kysely
      .selectFrom('role')
      .select(ROLE_COLUMNS)
      .where('id', '=', id)
      .executeTakeFirst();
  }

  private async countPermissionsByRoleIds(
    roleIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (roleIds.length === 0) {
      return new Map();
    }

    const rows = await this.kysely
      .selectFrom('role_permission')
      .select((eb) => ['role_id', eb.fn.count('id').as('count')])
      .where('role_id', 'in', [...roleIds])
      .groupBy('role_id')
      .execute();

    return new Map(rows.map((row) => [row.role_id, Number(row.count)]));
  }
}
