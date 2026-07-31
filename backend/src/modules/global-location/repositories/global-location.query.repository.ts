import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';

import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { GlobalLocationQueryCriteria } from '../builders/query/global-location-query-criteria';
import {
  GLOBAL_LOCATION_CACHE_KEYS,
  GLOBAL_LOCATION_CACHE_TTL,
} from '../constants/global-location.cache.constants';
import { GlobalLocation } from '../domain/global-location.entity';
import { IGlobalLocationQueryRepository } from '../interfaces/global-location.query.repository.interface';
import { GlobalLocationPersistenceMapper } from '../mappers/persistence/global-location.persistence.mapper';

@Injectable()
export class GlobalLocationQueryRepository implements IGlobalLocationQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly persistenceMapper: GlobalLocationPersistenceMapper,
  ) {}

  /**
   * العمود `location` من نوع geometry وهو غائب عن أنواع Kysely المولّدة
   * (Prisma يعلّمه Unsupported)، لذا تُستخرج الإحداثيات بـ ST_X/ST_Y.
   */
  private get pointColumns() {
    return [
      sql<number | null>`ST_X(location)`.as('longitude'),
      sql<number | null>`ST_Y(location)`.as('latitude'),
    ];
  }

  @Cacheable({
    ttl: GLOBAL_LOCATION_CACHE_TTL.LIST,
    keyBuilder: (criteria: GlobalLocationQueryCriteria) => [
      GLOBAL_LOCATION_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.keyword ?? 'all',
      criteria.type ?? 'all',
      // null (الجذور) و undefined (بلا تصفية) حالتان مختلفتان
      criteria.parentId === undefined ? 'any' : (criteria.parentId ?? 'roots'),
    ],
  })
  async findMany(
    criteria: GlobalLocationQueryCriteria,
  ): Promise<[GlobalLocation[], number]> {
    let query = this.kysely
      .selectFrom('global_location')
      .select(['id', 'name', 'type', 'parent_id']);
    let countQuery = this.kysely
      .selectFrom('global_location')
      .select((eb) => eb.fn.count('id').as('count'));

    if (criteria.search) {
      const keyword = `%${criteria.search.keyword}%`;
      query = query.where('name', 'ilike', keyword);
      countQuery = countQuery.where('name', 'ilike', keyword);
    }

    if (criteria.type) {
      query = query.where('type', '=', criteria.type);
      countQuery = countQuery.where('type', '=', criteria.type);
    }

    if (criteria.parentId === null) {
      query = query.where('parent_id', 'is', null);
      countQuery = countQuery.where('parent_id', 'is', null);
    } else if (criteria.parentId !== undefined) {
      query = query.where('parent_id', '=', criteria.parentId);
      countQuery = countQuery.where('parent_id', '=', criteria.parentId);
    }

    query = query
      .orderBy('type', 'asc')
      .orderBy('name', 'asc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    // القائمة لا تعرض الإحداثيات، فنتجنب ST_X/ST_Y هنا.
    const mappedItems = items.map((item) =>
      this.persistenceMapper.toDomain(item),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: GLOBAL_LOCATION_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<GlobalLocation | null> {
    const location = await this.kysely
      .selectFrom('global_location')
      .select(['id', 'name', 'type', 'parent_id'])
      .select(this.pointColumns)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!location) return null;

    return this.persistenceMapper.toDomain(location);
  }

  /**
   * استعلام تكراري: صعود الشجرة في رحلة واحدة إلى قاعدة البيانات بدل
   * استعلام لكل مستوى.
   */
  async findAncestors(id: string): Promise<GlobalLocation[]> {
    const result = await sql<{
      id: string;
      name: string;
      type: string;
      parent_id: string | null;
      depth: number;
    }>`
      WITH RECURSIVE ancestors AS (
        SELECT gl.id, gl.name, gl.type, gl.parent_id, 0 AS depth
        FROM global_location gl
        WHERE gl.id = ${id}

        UNION ALL

        SELECT parent.id, parent.name, parent.type, parent.parent_id, a.depth + 1
        FROM global_location parent
        JOIN ancestors a ON a.parent_id = parent.id
      )
      SELECT id, name, type, parent_id, depth
      FROM ancestors
      WHERE depth > 0
      ORDER BY depth DESC
    `.execute(this.kysely);

    return result.rows.map((row) => this.persistenceMapper.toDomain(row));
  }

  async countChildren(id: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('global_location')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('parent_id', '=', id)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async countOrgUnitMappings(id: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('org_unit_location_mapping')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('global_location_id', '=', id)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }
}
