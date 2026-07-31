import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { PermissionQueryCriteria } from '../builders/query/permission-query-criteria';
import {
  PERMISSION_CACHE_KEYS,
  PERMISSION_CACHE_TTL,
} from '../constants/permission.cache.constants';
import { Permission } from '../domain/permission.entity';
import { PermissionSearchField } from '../enums/permission-search-field.enum';
import { IPermissionQueryRepository } from '../interfaces/permission.query.repository.interface';
import { PermissionPersistenceMapper } from '../mappers/persistence/permission.persistence.mapper';

const PERMISSION_COLUMNS = [
  'id',
  'name',
  'resource',
  'action',
  'description',
] as const;

@Injectable()
export class PermissionQueryRepository implements IPermissionQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly permissionPersistenceMapper: PermissionPersistenceMapper,
  ) {}

  @Cacheable({
    ttl: PERMISSION_CACHE_TTL.LIST,
    keyBuilder: (criteria: PermissionQueryCriteria) => [
      PERMISSION_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.field ?? 'any',
      criteria.search?.keyword ?? 'all',
      criteria.resource ?? 'all',
    ],
  })
  async findMany(
    criteria: PermissionQueryCriteria,
  ): Promise<[Permission[], number]> {
    let query = this.kysely.selectFrom('permission').select(PERMISSION_COLUMNS);
    let countQuery = this.kysely
      .selectFrom('permission')
      .select((eb) => eb.fn.count('id').as('count'));

    if (criteria.search) {
      const field =
        criteria.search.field === PermissionSearchField.RESOURCE
          ? 'resource'
          : 'name';
      const keyword = `%${criteria.search.keyword}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (criteria.resource) {
      query = query.where('resource', '=', criteria.resource);
      countQuery = countQuery.where('resource', '=', criteria.resource);
    }

    query = query
      .orderBy('resource', 'asc')
      .orderBy('name', 'asc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const mappedItems = items.map((permission) =>
      this.permissionPersistenceMapper.toDomain(permission),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: PERMISSION_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [PERMISSION_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<Permission | null> {
    const permission = await this.kysely
      .selectFrom('permission')
      .select(PERMISSION_COLUMNS)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!permission) return null;

    return this.permissionPersistenceMapper.toDomain(permission);
  }

  /**
   * يستخدمها موديول الأدوار لعرض صلاحيات دور بعينه.
   */
  async findByRoleId(roleId: string): Promise<Permission[]> {
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
      .where('role_permission.role_id', '=', roleId)
      .orderBy('permission.resource', 'asc')
      .orderBy('permission.name', 'asc')
      .execute();

    return permissions.map((permission) =>
      this.permissionPersistenceMapper.toDomain(permission),
    );
  }
}
