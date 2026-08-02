import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

<<<<<<<< HEAD:backend/src/modules/authorization/permission/repositories/permission.query.repository.ts
import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { PermissionQueryCriteria } from '../builders/query/permission-query-criteria';
========
import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { TransactionalPrismaService } from '../../../packages/transaction';
>>>>>>>> bd5bcedf760812c3f4fae1fb4b0cc179fb305a8c:backend/src/modules/authorization/repositories/permission.repository.ts
import {
  PERMISSION_CATALOG_ENTRIES,
  PermissionCatalogEntry,
} from '../catalog/permission.catalog';
import { Permission } from '../domain/permission.entity';
import { PermissionSearchField } from '../domain/enums/permission.enum';
import { PermissionPersistenceMapper } from '../mappers/persistence/permission.persistence.mapper';
import { PermissionQueryDto } from '../dtos/requests/permission-query.dto';

const PERMISSION_COLUMNS = [
  'id',
  'name',
  'resource',
  'action',
  'description',
] as const;

@Injectable()
export class PermissionRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly permissionPersistenceMapper: PermissionPersistenceMapper,
  ) {}

  async syncCatalog(entries: readonly PermissionCatalogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.prisma.client.permission.upsert({
        where: { name: entry.name },
        create: {
          name: entry.name,
          resource: entry.resource,
          action: entry.action,
          description: entry.description,
        },
        update: {
          resource: entry.resource,
          action: entry.action,
          description: entry.description,
        },
      });
    }
  }

  async findMany(
    queryDto: PermissionQueryDto,
  ): Promise<[Permission[], number]> {
    let query = this.kysely.selectFrom('permission').select(PERMISSION_COLUMNS);
    let countQuery = this.kysely
      .selectFrom('permission')
      .select((eb) => eb.fn.count('id').as('count'));

    if (queryDto.search) {
      const field =
        queryDto.searchType === PermissionSearchField.RESOURCE
          ? 'resource'
          : 'name';
      const keyword = `%${queryDto.search}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (queryDto.resource) {
      query = query.where('resource', '=', queryDto.resource);
      countQuery = countQuery.where('resource', '=', queryDto.resource);
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    query = query
      .orderBy('resource', 'asc')
      .orderBy('name', 'asc')
      .offset(skip)
      .limit(limit);

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
    ttl: 3600,
    keyBuilder: (id: string) => ['permissions', 'details', id],
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
