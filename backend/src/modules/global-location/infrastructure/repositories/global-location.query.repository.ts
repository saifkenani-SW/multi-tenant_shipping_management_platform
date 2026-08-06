import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { GlobalLocationQueryDto } from '../../application/dtos/requests/global-location-query.dto';
import { GlobalLocationResponseDto } from '../../application/dtos/responses/global-location.response.dto';
import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import {
  GLOBAL_LOCATION_CACHE_KEYS,
  GLOBAL_LOCATION_CACHE_TTL,
} from '../../constants/global-location.cache.constants';
import { CursorPaginatedResponse } from '../../../../common/pagination';

@Injectable()
export class GlobalLocationQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    ttl: GLOBAL_LOCATION_CACHE_TTL.LIST,
    keyBuilder: (criteria: GlobalLocationQueryDto) => [
      GLOBAL_LOCATION_CACHE_KEYS.LIST,
      criteria.name || 'none',
      criteria.type || 'none',
      criteria.parentId || 'none',
      criteria.cursor || 'first',
      criteria.limit || 20,
    ],
  })
  async findMany(
    criteria: GlobalLocationQueryDto,
  ): Promise<CursorPaginatedResponse<GlobalLocationResponseDto>> {
    let query = this.kysely
      .selectFrom('global_location as gl')
      .select([
        'gl.id',
        'gl.name',
        'gl.type',
        'gl.parent_id',
        sql<number>`ST_X(gl.location::geometry)`.as('longitude'),
        sql<number>`ST_Y(gl.location::geometry)`.as('latitude'),
      ]);

    if (criteria.name) {
      query = query.where('gl.name', 'ilike', `${criteria.name}%`);
    }

    if (criteria.type) {
      query = query.where('gl.type', '=', criteria.type);
    }

    if (criteria.parentId) {
      query = query.where('gl.parent_id', '=', criteria.parentId);
    }

    if (criteria.cursor) {
      query = query.where('gl.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;

    query = query.orderBy('gl.id', 'desc').limit(limit + 1);

    const records = await query.execute();

    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
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
        name: record.name,
        type: record.type,
        parentId: record.parent_id || undefined,
        location,
      } as GlobalLocationResponseDto;
    });

    const endCursor = items.length > 0 ? items[items.length - 1].id : null;

    return new CursorPaginatedResponse<GlobalLocationResponseDto>(items, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor: endCursor,
      previousCursor: null, // Since we only paginate forward for now
    });
  }

  @Cacheable({
    ttl: GLOBAL_LOCATION_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<GlobalLocationResponseDto | null> {
    const record = await this.kysely
      .selectFrom('global_location as gl')
      .select([
        'gl.id',
        'gl.name',
        'gl.type',
        'gl.parent_id',
        sql<number>`ST_X(gl.location::geometry)`.as('longitude'),
        sql<number>`ST_Y(gl.location::geometry)`.as('latitude'),
      ])
      .where('gl.id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    const location =
      record.longitude != null && record.latitude != null
        ? {
            longitude: Number(record.longitude),
            latitude: Number(record.latitude),
          }
        : undefined;

    return {
      id: record.id,
      name: record.name,
      type: record.type,
      parentId: record.parent_id || undefined,
      location,
    } as GlobalLocationResponseDto;
  }

  async validateLocationsExist(ids: string[]): Promise<boolean> {
    const records = await this.kysely
      .selectFrom('global_location')
      .select('id')
      .where('id', 'in', ids)
      .execute();
    return records.length === ids.length;
  }
}
