import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { PermissionPersistenceMapper } from '../../permission/mappers/persistence/permission.persistence.mapper';
import { RoleQueryCriteria } from '../builders/query/role-query-criteria';
import {
  ROLE_CACHE_KEYS,
  ROLE_CACHE_TTL,
} from '../constants/role.cache.constants';
import { Role } from '../domain/role.entity';
import { RoleSearchField } from '../enums/role-search-field.enum';
import { IRoleQueryRepository } from '../interfaces/role.query.repository.interface';
import { RolePersistenceMapper } from '../mappers/persistence/role.persistence.mapper';

const ROLE_COLUMNS = [
  'id',
  'tenant_id',
  'name',
  'description',
  'is_active',
  'created_at',
] as const;

@Injectable()
export class RoleQueryRepository implements IRoleQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly rolePersistenceMapper: RolePersistenceMapper,
    private readonly permissionPersistenceMapper: PermissionPersistenceMapper,
  ) {}

  @Cacheable({
    ttl: ROLE_CACHE_TTL.LIST,
    keyBuilder: (criteria: RoleQueryCriteria) => [
      ROLE_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.field ?? 'any',
      criteria.search?.keyword ?? 'all',
      criteria.tenantId ?? 'all',
      criteria.isActive ?? 'all',
    ],
  })
  async findMany(criteria: RoleQueryCriteria): Promise<[Role[], number]> {
    let query = this.kysely.selectFrom('role').select(ROLE_COLUMNS);
    let countQuery = this.kysely
      .selectFrom('role')
      .select((eb) => eb.fn.count('id').as('count'));

    if (criteria.search) {
      const field =
        criteria.search.field === RoleSearchField.DESCRIPTION
          ? 'description'
          : 'name';
      const keyword = `%${criteria.search.keyword}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (criteria.isActive !== undefined) {
      query = query.where('is_active', '=', criteria.isActive);
      countQuery = countQuery.where('is_active', '=', criteria.isActive);
    }

    if (criteria.tenantId) {
      query = query.where('tenant_id', '=', criteria.tenantId);
      countQuery = countQuery.where('tenant_id', '=', criteria.tenantId);
    }

    query = query
      .orderBy('created_at', 'desc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    // عدد الصلاحيات لكل دور في استعلام واحد بدلاً من استعلام لكل صف.
    const permissionCounts = await this.countPermissionsByRoleIds(
      items.map((role) => role.id),
    );

    const mappedItems = items.map((role) =>
      this.rolePersistenceMapper.toDomain(
        role,
        // القائمة تحتاج العدد فقط، فنملأ عناصر فارغة بالطول الصحيح.
        new Array(permissionCounts.get(role.id) ?? 0).fill(
          undefined,
        ) as never[],
      ),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: ROLE_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [ROLE_CACHE_KEYS.DETAILS, id],
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

  /**
   * غير مُخزَّن مؤقتاً: تستدعيه استراتيجيات التفويض قبل كل عملية كتابة،
   * وقراءة قديمة هنا تعني قراراً خاطئاً بالصلاحية.
   */
  async findById(id: string): Promise<Role | null> {
    const role = await this.selectRoleById(id);

    if (!role) return null;

    return this.rolePersistenceMapper.toDomain(role);
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
