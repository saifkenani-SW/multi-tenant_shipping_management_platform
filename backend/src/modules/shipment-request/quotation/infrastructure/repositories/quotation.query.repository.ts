import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import type { QuotationMergedCriteria } from '../../application/dtos/requests/quotation-merged-criteria.interface';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  QUOTATION_CACHE_KEYS,
  QUOTATION_CACHE_TTL,
} from '../../constants/quotation.cache.constants';

@Injectable()
export class QuotationQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  private baseSelect() {
    return this.kysely
      .selectFrom('quotation as q')
      .select([
        'q.id',
        'q.tenant_id',
        'q.shipment_request_id',
        'q.origin_org_unit_id',
        'q.destination_org_unit_id',
        'q.service_level',
        'q.quotation_type',
        'q.base_price',
        'q.weight_charge',
        'q.extra_fees',
        'q.amount',
        'q.pricing_snapshot',
        'q.status',
        'q.created_at',
      ]);
  }

  @Cacheable({
    keyPrefix: QUOTATION_CACHE_KEYS.LIST,
    ttl: QUOTATION_CACHE_TTL.LIST,
    keyBuilder: (criteria: QuotationMergedCriteria) => [
      QUOTATION_CACHE_KEYS.LIST,
      criteria.tenantId || 'none',
      criteria.originOrgUnitId || 'none',
      criteria.destinationOrgUnitId || 'none',
      criteria.serviceLevel || 'none',
      criteria.status || 'none',
      criteria.limit || 20,
      criteria.cursor || 'none',
    ],
  })
  async findMany(criteria: QuotationMergedCriteria): Promise<CursorPaginatedResponse<any>> {
    let query: any = this.baseSelect();

    if (criteria.tenantId) {
      query = query.where('q.tenant_id', '=', criteria.tenantId);
    }

    if (criteria.originOrgUnitId) {
      query = query.where('q.origin_org_unit_id', '=', criteria.originOrgUnitId);
    }

    if (criteria.destinationOrgUnitId) {
      query = query.where('q.destination_org_unit_id', '=', criteria.destinationOrgUnitId);
    }

    if (criteria.serviceLevel) {
      query = query.where('q.service_level', '=', criteria.serviceLevel);
    }

    if (criteria.status) {
      query = query.where('q.status', '=', criteria.status);
    }

    if (criteria.cursor) {
      query = query.where('q.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('q.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) records.pop();

    const endCursor = records.length > 0 ? records[records.length - 1].id : null;

    return new CursorPaginatedResponse(records, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor: endCursor,
      previousCursor: null,
    });
  }

  @Cacheable({
    keyPrefix: QUOTATION_CACHE_KEYS.DETAILS,
    ttl: QUOTATION_CACHE_TTL.DETAILS,
  })
  async findById(
    id: string,
  ): Promise<any | null> {
    let query = this.baseSelect().where('q.id', '=', id);
    return query.executeTakeFirst() ?? null;
  }

  @Cacheable({
    keyPrefix: QUOTATION_CACHE_KEYS.BY_REQUEST,
    ttl: QUOTATION_CACHE_TTL.BY_REQUEST,
  })
  async findByShipmentRequestId(
    shipmentRequestId: string,
  ): Promise<any[]> {
    let query = this.baseSelect().where(
      'q.shipment_request_id',
      '=',
      shipmentRequestId,
    );
    return query.execute();
  }
}
