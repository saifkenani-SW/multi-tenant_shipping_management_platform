import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { TenantZoneResponseDto } from '../../application/dtos/responses/tenant-zone.response.dto';
import { TenantZoneQueryDto } from '../../application/dtos/requests/tenant-zone-query.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  TENANT_ZONE_CACHE_KEYS,
  TENANT_ZONE_CACHE_TTL,
} from '../../constants/tenant-zone.cache.constants';

@Injectable()
export class TenantZoneQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    ttl: TENANT_ZONE_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [TENANT_ZONE_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<TenantZoneResponseDto | null> {
    const record = await this.kysely
      .selectFrom('tenant_zone as tz')
      .select([
        'tz.id',
        'tz.tenant_id',
        'tz.name',
        'tz.description',
        'tz.is_active',
        'tz.created_at',
      ])
      .where('tz.id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    const units = await this.kysely
      .selectFrom('organization_unit as ou')
      .select(['ou.id', 'ou.name'])
      .where('ou.zone_id', '=', id)
      .execute();

    return {
      id: record.id,
      tenantId: record.tenant_id,
      name: record.name,
      description: record.description || undefined,
      isActive: record.is_active,
      createdAt: record.created_at,
      organizationUnits: units,
    };
  }

  @Cacheable({
    ttl: TENANT_ZONE_CACHE_TTL.LIST,
    keyBuilder: (criteria: TenantZoneQueryDto, tenantId?: string) => [
      TENANT_ZONE_CACHE_KEYS.LIST,
      tenantId || 'none',
      criteria.limit || 10,
      criteria.cursor || 'none',
      criteria.name || 'none',
      criteria.isActive !== undefined ? String(criteria.isActive) : 'none',
    ],
  })
  async findMany(
    criteria: TenantZoneQueryDto,
    tenantId?: string,
  ): Promise<CursorPaginatedResponse<TenantZoneResponseDto>> {
    let query = this.kysely
      .selectFrom('tenant_zone as tz')
      .select([
        'tz.id',
        'tz.tenant_id',
        'tz.name',
        'tz.description',
        'tz.is_active',
        'tz.created_at',
      ]);

    if (tenantId) {
      query = query.where('tz.tenant_id', '=', tenantId);
    }

    if (criteria.name) {
      query = query.where('tz.name', 'ilike', `${criteria.name}%`);
    }
    if (criteria.isActive !== undefined) {
      query = query.where('tz.is_active', '=', criteria.isActive);
    }
    if (criteria.cursor) {
      query = query.where('tz.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('tz.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    const items: TenantZoneResponseDto[] = records.map((record) => ({
      id: record.id,
      tenantId: record.tenant_id,
      name: record.name,
      description: record.description || undefined,
      isActive: record.is_active,
      createdAt: record.created_at,
    }));

    const endCursor = items.length > 0 ? items[items.length - 1].id : null;

    return new CursorPaginatedResponse<TenantZoneResponseDto>(items, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor: endCursor,
      previousCursor: null,
    });
  }
}
