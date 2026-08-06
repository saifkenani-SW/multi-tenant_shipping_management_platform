import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { OrganizationUnitResponseDto } from '../../application/dtos/responses/organization-unit.response.dto';
import { OrganizationUnitQueryDto } from '../../application/dtos/requests/organization-unit-query.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  ORG_UNIT_CACHE_KEYS,
  ORG_UNIT_CACHE_TTL,
} from '../../constants/organization-unit.cache.constants';

@Injectable()
export class OrganizationUnitQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    ttl: ORG_UNIT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [ORG_UNIT_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<OrganizationUnitResponseDto | null> {
    const record = await this.kysely
      .selectFrom('organization_unit as ou')
      .select([
        'ou.id',
        'ou.tenant_id',
        'ou.name',
        'ou.org_type',
        'ou.parent_id',
        'ou.zone_id',
        'ou.address_line',
        'ou.is_active',
        'ou.created_at',
        'ou.updated_at',
        sql<number>`ST_X(ou.location::geometry)`.as('longitude'),
        sql<number>`ST_Y(ou.location::geometry)`.as('latitude'),
      ])
      .where('ou.id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    // Fetch mappings
    const mappings = await this.kysely
      .selectFrom('org_unit_location_mapping')
      .select(['global_location_id', 'coverage_type'])
      .where('organization_unit_id', '=', id)
      .execute();

    const location =
      record.longitude != null && record.latitude != null
        ? {
            longitude: Number(record.longitude),
            latitude: Number(record.latitude),
          }
        : undefined;

    return {
      id: record.id,
      tenantId: record.tenant_id,
      name: record.name,
      orgType: record.org_type as any,
      parentId: record.parent_id || undefined,
      zoneId: record.zone_id || undefined,
      addressLine: record.address_line || undefined,
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      location,
      coverageLocations: mappings.map((m) => ({
        globalLocationId: m.global_location_id,
        coverageType: m.coverage_type as any,
      })),
    };
  }

  @Cacheable({
    ttl: ORG_UNIT_CACHE_TTL.LIST,
    keyBuilder: (criteria: OrganizationUnitQueryDto, tenantId?: string) => [
      ORG_UNIT_CACHE_KEYS.LIST,
      tenantId || 'none',
      criteria.limit || 10,
      criteria.cursor || 'none',
      criteria.name || 'none',
      criteria.orgType || 'none',
      criteria.parentId || 'none',
      criteria.zoneId || 'none',
      criteria.isActive !== undefined ? String(criteria.isActive) : 'none',
    ],
  })
  async findMany(
    criteria: OrganizationUnitQueryDto,
    tenantId?: string,
  ): Promise<CursorPaginatedResponse<OrganizationUnitResponseDto>> {
    let query = this.kysely
      .selectFrom('organization_unit as ou')
      .select([
        'ou.id',
        'ou.tenant_id',
        'ou.name',
        'ou.org_type',
        'ou.parent_id',
        'ou.zone_id',
        'ou.address_line',
        'ou.is_active',
        'ou.created_at',
        'ou.updated_at',
        sql<number>`ST_X(ou.location::geometry)`.as('longitude'),
        sql<number>`ST_Y(ou.location::geometry)`.as('latitude'),
      ]);

    if (tenantId) {
      query = query.where('ou.tenant_id', '=', tenantId);
    }

    if (criteria.name) {
      query = query.where('ou.name', 'ilike', `${criteria.name}%`);
    }
    if (criteria.orgType) {
      query = query.where('ou.org_type', '=', criteria.orgType as any);
    }
    if (criteria.parentId) {
      query = query.where('ou.parent_id', '=', criteria.parentId);
    }
    if (criteria.zoneId) {
      query = query.where('ou.zone_id', '=', criteria.zoneId);
    }
    if (criteria.isActive !== undefined) {
      query = query.where('ou.is_active', '=', criteria.isActive);
    }
    if (criteria.cursor) {
      query = query.where('ou.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('ou.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    if (records.length === 0) {
      return new CursorPaginatedResponse<OrganizationUnitResponseDto>([], {
        hasNextPage: false,
        hasPreviousPage: !!criteria.cursor,
        nextCursor: null,
        previousCursor: null,
      });
    }

    const items = records.map((record) => {
      const location =
        record.longitude != null && record.latitude != null
          ? {
              longitude: Number(record.longitude),
              latitude: Number(record.latitude),
            }
          : undefined;

      return {
        id: record.id,
        tenantId: record.tenant_id,
        name: record.name,
        orgType: record.org_type as any,
        parentId: record.parent_id || undefined,
        zoneId: record.zone_id || undefined,
        addressLine: record.address_line || undefined,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        location,
      };
    });

    const endCursor = items.length > 0 ? items[items.length - 1].id : null;

    return new CursorPaginatedResponse<OrganizationUnitResponseDto>(items, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor: endCursor,
      previousCursor: null,
    });
  }

  async countByType(tenantId: string, orgType: string): Promise<number> {
    const record = await this.kysely
      .selectFrom('organization_unit as ou')
      .select((eb) => eb.fn.count('ou.id').as('count'))
      .where('ou.tenant_id', '=', tenantId)
      .where('ou.org_type', '=', orgType as any)
      .executeTakeFirst();

    return Number(record?.count || 0);
  }
}
