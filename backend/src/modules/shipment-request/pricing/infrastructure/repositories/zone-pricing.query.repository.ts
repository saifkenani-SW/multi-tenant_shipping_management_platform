import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { ZonePricingResponseDto } from '../../application/dtos/responses/zone-pricing.response.dto';
import { ZonePricingQueryDto } from '../../application/dtos/requests/zone-pricing-query.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  PRICING_CACHE_KEYS,
  PRICING_CACHE_TTL,
} from '../../constants/pricing.cache.constants';

@Injectable()
export class ZonePricingQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    ttl: PRICING_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [PRICING_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<ZonePricingResponseDto | null> {
    const record = await this.kysely
      .selectFrom('zone_pricing_matrix as zp')
      .selectAll('zp')
      .where('zp.id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    return {
      id: record.id,
      tenantId: record.tenant_id,
      originZoneId: record.origin_zone_id,
      destinationZoneId: record.destination_zone_id,
      serviceLevel: record.service_level as any,
      basePrice: Number(record.base_price),
      baseWeightKg: Number(record.base_weight_kg),
      pricePerExtraKg: Number(record.price_per_extra_kg),
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  @Cacheable({
    ttl: PRICING_CACHE_TTL.LIST,
    keyBuilder: (query: ZonePricingQueryDto, tenantId?: string) => [
      PRICING_CACHE_KEYS.LIST,
      tenantId || 'none',
      query.limit || 10,
      query.cursor || 'none',
      query.originZoneId || 'none',
      query.destinationZoneId || 'none',
      query.serviceLevel || 'none',
      query.isActive !== undefined ? String(query.isActive) : 'none',
    ],
  })
  async findMany(
    query: ZonePricingQueryDto,
    tenantId?: string,
  ): Promise<CursorPaginatedResponse<ZonePricingResponseDto>> {
    const {
      limit,
      cursor,
      originZoneId,
      destinationZoneId,
      serviceLevel,
      isActive,
    } = query;

    let queryBuilder = this.kysely
      .selectFrom('zone_pricing_matrix as zp')
      .selectAll('zp')
      .limit(limit + 1)
      .orderBy('zp.id', 'desc');

    if (tenantId) {
      queryBuilder = queryBuilder.where('zp.tenant_id', '=', tenantId);
    }

    if (originZoneId) {
      queryBuilder = queryBuilder.where('zp.origin_zone_id', '=', originZoneId);
    }
    if (destinationZoneId) {
      queryBuilder = queryBuilder.where(
        'zp.destination_zone_id',
        '=',
        destinationZoneId,
      );
    }
    if (serviceLevel) {
      queryBuilder = queryBuilder.where(
        'zp.service_level',
        '=',
        serviceLevel as any,
      );
    }
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.where('zp.is_active', '=', isActive);
    }

    if (cursor) {
      queryBuilder = queryBuilder.where('zp.id', '<', cursor);
    }

    const records = await queryBuilder.execute();
    const hasNextPage = records.length > limit;
    const paginatedRecords = hasNextPage ? records.slice(0, -1) : records;

    const data = paginatedRecords.map((record) => ({
      id: record.id,
      tenantId: record.tenant_id,
      originZoneId: record.origin_zone_id,
      destinationZoneId: record.destination_zone_id,
      serviceLevel: record.service_level as any,
      basePrice: Number(record.base_price),
      baseWeightKg: Number(record.base_weight_kg),
      pricePerExtraKg: Number(record.price_per_extra_kg),
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    let nextCursor: string | null = null;
    if (hasNextPage && paginatedRecords.length > 0) {
      const lastRecord = paginatedRecords[paginatedRecords.length - 1];
      nextCursor = lastRecord.id;
    }

    return {
      data,
      meta: {
        hasNextPage,
        nextCursor,
        hasPreviousPage: !!cursor,
        previousCursor: null,
      },
    };
  }

  async findPricesForZonePairsV2(
    zonePairs: {
      tenantId: string;
      originZoneId: string;
      destinationZoneId: string;
    }[],
  ): Promise<ZonePricingResponseDto[]> {
    if (zonePairs.length === 0) return [];

    const tuples = sql.join(
      zonePairs.map(
        (pair) =>
          sql`(${pair.tenantId}, ${pair.originZoneId}, ${pair.destinationZoneId})`,
      ),
      sql`, `,
    );

    const query = this.kysely
      .selectFrom('zone_pricing_matrix as zp')
      .selectAll('zp')
      .where('zp.is_active', '=', true)
      .where(
        sql<boolean>`(zp.tenant_id, zp.origin_zone_id, zp.destination_zone_id) IN (${tuples})`,
      );

    const records = await query.execute();

    return records.map((record) => ({
      id: record.id,
      tenantId: record.tenant_id,
      originZoneId: record.origin_zone_id,
      destinationZoneId: record.destination_zone_id,
      serviceLevel: record.service_level as any,
      basePrice: Number(record.base_price),
      baseWeightKg: Number(record.base_weight_kg),
      pricePerExtraKg: Number(record.price_per_extra_kg),
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }

  async findPricesForZonePairs(
    zonePairs: {
      tenantId: string;
      originZoneId: string;
      destinationZoneId: string;
    }[],
  ): Promise<ZonePricingResponseDto[]> {
    if (zonePairs.length === 0) return [];

    let query = this.kysely
      .selectFrom('zone_pricing_matrix as zp')
      .selectAll('zp')
      .where((eb) =>
        eb.and([
          eb('zp.is_active', '=', true),
          eb.or(
            zonePairs.map((pair) =>
              eb.and([
                eb('zp.tenant_id', '=', pair.tenantId),
                eb('zp.origin_zone_id', '=', pair.originZoneId),
                eb('zp.destination_zone_id', '=', pair.destinationZoneId),
              ]),
            ),
          ),
        ]),
      );

    const records = await query.execute();

    return records.map((record) => ({
      id: record.id,
      tenantId: record.tenant_id,
      originZoneId: record.origin_zone_id,
      destinationZoneId: record.destination_zone_id,
      serviceLevel: record.service_level as any,
      basePrice: Number(record.base_price),
      baseWeightKg: Number(record.base_weight_kg),
      pricePerExtraKg: Number(record.price_per_extra_kg),
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }
}
