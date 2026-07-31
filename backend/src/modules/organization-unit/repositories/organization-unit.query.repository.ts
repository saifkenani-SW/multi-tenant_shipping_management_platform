import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';

import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { OrganizationUnitQueryCriteria } from '../builders/query/organization-unit-query-criteria';
import {
  ORGANIZATION_UNIT_CACHE_KEYS,
  ORGANIZATION_UNIT_CACHE_TTL,
} from '../constants/organization-unit.cache.constants';
import { OrganizationUnit } from '../domain/organization-unit.entity';
import { OrganizationUnitSearchField } from '../enums/organization-unit-search-field.enum';
import { IOrganizationUnitQueryRepository } from '../interfaces/organization-unit.query.repository.interface';
import { OrganizationUnitPersistenceMapper } from '../mappers/persistence/organization-unit.persistence.mapper';

const UNIT_COLUMNS = [
  'id',
  'tenant_id',
  'name',
  'org_type',
  'parent_id',
  'zone_id',
  'address_line',
  'is_active',
  'created_at',
  'updated_at',
] as const;

@Injectable()
export class OrganizationUnitQueryRepository implements IOrganizationUnitQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly persistenceMapper: OrganizationUnitPersistenceMapper,
  ) {}

  /**
   * `location` عمود geometry غائب عن أنواع Kysely المولّدة، فتُستخرج
   * إحداثياته صراحة.
   */
  private get pointColumns() {
    return [
      sql<number | null>`ST_X(location)`.as('longitude'),
      sql<number | null>`ST_Y(location)`.as('latitude'),
    ];
  }

  @Cacheable({
    ttl: ORGANIZATION_UNIT_CACHE_TTL.LIST,
    keyBuilder: (criteria: OrganizationUnitQueryCriteria) => [
      ORGANIZATION_UNIT_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.field ?? 'any',
      criteria.search?.keyword ?? 'all',
      criteria.tenantId ?? 'all',
      criteria.orgType ?? 'all',
      criteria.zoneId ?? 'all',
      criteria.isActive ?? 'all',
      criteria.parentId === undefined ? 'any' : (criteria.parentId ?? 'roots'),
    ],
  })
  async findMany(
    criteria: OrganizationUnitQueryCriteria,
  ): Promise<[OrganizationUnit[], number]> {
    let query = this.kysely
      .selectFrom('organization_unit')
      .select(UNIT_COLUMNS);
    let countQuery = this.kysely
      .selectFrom('organization_unit')
      .select((eb) => eb.fn.count('id').as('count'));

    if (criteria.search) {
      const field =
        criteria.search.field === OrganizationUnitSearchField.ADDRESS
          ? 'address_line'
          : 'name';
      const keyword = `%${criteria.search.keyword}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (criteria.tenantId) {
      query = query.where('tenant_id', '=', criteria.tenantId);
      countQuery = countQuery.where('tenant_id', '=', criteria.tenantId);
    }

    if (criteria.orgType) {
      query = query.where('org_type', '=', criteria.orgType);
      countQuery = countQuery.where('org_type', '=', criteria.orgType);
    }

    if (criteria.zoneId) {
      query = query.where('zone_id', '=', criteria.zoneId);
      countQuery = countQuery.where('zone_id', '=', criteria.zoneId);
    }

    if (criteria.isActive !== undefined) {
      query = query.where('is_active', '=', criteria.isActive);
      countQuery = countQuery.where('is_active', '=', criteria.isActive);
    }

    if (criteria.parentId === null) {
      query = query.where('parent_id', 'is', null);
      countQuery = countQuery.where('parent_id', 'is', null);
    } else if (criteria.parentId !== undefined) {
      query = query.where('parent_id', '=', criteria.parentId);
      countQuery = countQuery.where('parent_id', '=', criteria.parentId);
    }

    query = query
      .orderBy('name', 'asc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    // القائمة لا تعرض الإحداثيات ولا التغطية، فنتجنب الحسابات الإضافية.
    const mappedItems = items.map((item) =>
      this.persistenceMapper.toDomain(item),
    );

    return [mappedItems, total];
  }

  /**
   * غير مُخزَّن مؤقتاً: تستدعيه استراتيجيات التفويض قبل كل عملية كتابة،
   * وقراءة قديمة هنا تعني قراراً خاطئاً بالصلاحية.
   */
  async findById(id: string): Promise<OrganizationUnit | null> {
    const unit = await this.kysely
      .selectFrom('organization_unit')
      .select(UNIT_COLUMNS)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!unit) return null;

    return this.persistenceMapper.toDomain(unit);
  }

  @Cacheable({
    ttl: ORGANIZATION_UNIT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [ORGANIZATION_UNIT_CACHE_KEYS.DETAILS, id],
  })
  async findByIdWithCoverage(id: string): Promise<OrganizationUnit | null> {
    const unit = await this.kysely
      .selectFrom('organization_unit')
      .select(UNIT_COLUMNS)
      .select(this.pointColumns)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!unit) return null;

    const coverage = await this.kysely
      .selectFrom('org_unit_location_mapping')
      .select('global_location_id')
      .where('organization_unit_id', '=', id)
      .execute();

    return this.persistenceMapper.toDomain(
      unit,
      coverage.map((row) => row.global_location_id),
    );
  }

  /**
   * صعود الشجرة عبر parent_id في رحلة واحدة.
   *
   * `tree_path` (ltree) متاح ويمكن أن يكون أسرع، لكنه عمود Unsupported
   * غائب عن أنواع Kysely، ويصبح غير موثوق إن كتب أحد صفاً دون تعبئته.
   * parent_id هو المصدر الذي تفرضه قاعدة البيانات بمفتاح أجنبي.
   */
  async findAncestors(id: string): Promise<OrganizationUnit[]> {
    const result = await sql<{
      id: string;
      tenant_id: string;
      name: string;
      org_type: string;
      parent_id: string | null;
      zone_id: string | null;
      address_line: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      depth: number;
    }>`
      WITH RECURSIVE ancestors AS (
        SELECT ou.id, ou.tenant_id, ou.name, ou.org_type, ou.parent_id,
               ou.zone_id, ou.address_line, ou.is_active,
               ou.created_at, ou.updated_at, 0 AS depth
        FROM organization_unit ou
        WHERE ou.id = ${id}

        UNION ALL

        SELECT parent.id, parent.tenant_id, parent.name, parent.org_type,
               parent.parent_id, parent.zone_id, parent.address_line,
               parent.is_active, parent.created_at, parent.updated_at,
               a.depth + 1
        FROM organization_unit parent
        JOIN ancestors a ON a.parent_id = parent.id
      )
      SELECT id, tenant_id, name, org_type, parent_id, zone_id,
             address_line, is_active, created_at, updated_at, depth
      FROM ancestors
      WHERE depth > 0
      ORDER BY depth DESC
    `.execute(this.kysely);

    return result.rows.map((row) => this.persistenceMapper.toDomain(row));
  }

  async countChildren(id: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('organization_unit')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('parent_id', '=', id)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async countActiveAssignments(id: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('employee_assignment')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('organization_unit_id', '=', id)
      .where('is_active', '=', true)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async findExistingLocationIds(
    locationIds: readonly string[],
  ): Promise<string[]> {
    if (locationIds.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .selectFrom('global_location')
      .select('id')
      .where('id', 'in', [...locationIds])
      .execute();

    return rows.map((row) => row.id);
  }
}
