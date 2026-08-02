import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { CustomerShipmentEntity } from '../../domain/entities/customer-shipment.entity';
import { CustomerShipmentPersistenceMapper } from '../mappers/customer-shipment.persistence.mapper';
import { CustomerShipmentQueryCriteria } from '../../application/builders/query/customer-shipment-query-criteria';
import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import {
  SHIPMENT_CACHE_KEYS,
  SHIPMENT_CACHE_TTL,
} from '../../constants/shipment.cache.constants';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import {
  CursorPaginatedResponse,
  CursorPaginationMeta,
} from '../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { sql } from 'kysely';

@Injectable()
export class CustomerShipmentQueryRepository {
  constructor(@Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>) {}

  @Cacheable({
    ttl: SHIPMENT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [SHIPMENT_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<CustomerShipmentEntity | null> {
    const record = await this.kysely
      .selectFrom('customer_shipment as cs')
      .leftJoin('parcel as p', 'cs.id', 'p.customer_shipment_id')
      .select((eb) => [
        'cs.id',
        'cs.tenant_id',
        'cs.sender_customer_profile_id',
        'cs.receiver_customer_profile_id',
        'cs.shipment_request_id',
        'cs.approved_quotation_id',
        'cs.receiver_name',
        'cs.receiver_phone',
        'cs.receiver_address',
        'cs.payment_responsibility',
        'cs.total_chargeable_weight_kg',
        'cs.status',
        'cs.created_at',
        'cs.updated_at',
        eb.fn.coalesce(sql<any>`json_agg(p)`, eb.val('[]')).as('parcels'),
      ])
      .where('cs.id', '=', id)
      .groupBy('cs.id')
      .executeTakeFirst();

    if (!record) {
      return null;
    }

    // Ensure we don't pass an array with a single null value if no parcels exist
    let parcels: any[] = [];
    if (Array.isArray(record.parcels)) {
      parcels = record.parcels.filter((p: any) => p !== null);
    }

    return CustomerShipmentPersistenceMapper.toDomain({
      ...record,
      parcel: parcels,
    } as any);
  }

  @Cacheable({
    ttl: SHIPMENT_CACHE_TTL.LIST,
    keyBuilder: (criteria: CustomerShipmentQueryCriteria) => [
      SHIPMENT_CACHE_KEYS.LIST,
      criteria.pagination?.cursor ?? 'none',
      criteria.pagination?.limit ?? 10,
      criteria.tenantId ?? 'all',
      criteria.status ?? 'all',
      criteria.search ?? 'none',
      criteria.senderCustomerProfileId ?? 'all',
      criteria.receiverCustomerProfileId ?? 'all',
    ],
  })
  async findMany(
    criteria: CustomerShipmentQueryCriteria,
  ): Promise<CursorPaginatedResponse<CustomerShipmentEntity>> {
    let query = this.kysely
      .selectFrom('customer_shipment as cs')
      .leftJoin('parcel as p', 'cs.id', 'p.customer_shipment_id')
      .select((eb) => [
        'cs.id',
        'cs.tenant_id',
        'cs.sender_customer_profile_id',
        'cs.receiver_customer_profile_id',
        'cs.shipment_request_id',
        'cs.approved_quotation_id',
        'cs.receiver_name',
        'cs.receiver_phone',
        'cs.receiver_address',
        'cs.payment_responsibility',
        'cs.total_chargeable_weight_kg',
        'cs.status',
        'cs.created_at',
        'cs.updated_at',
        eb.fn.coalesce(sql<any>`json_agg(p)`, eb.val('[]')).as('parcels'),
      ])
      .groupBy('cs.id');

    if (criteria.tenantId) {
      query = query.where('cs.tenant_id', '=', criteria.tenantId);
    }

    if (criteria.senderCustomerProfileId) {
      query = query.where(
        'cs.sender_customer_profile_id',
        '=',
        criteria.senderCustomerProfileId,
      );
    }

    if (criteria.receiverCustomerProfileId) {
      query = query.where(
        'cs.receiver_customer_profile_id',
        '=',
        criteria.receiverCustomerProfileId,
      );
    }

    if (criteria.status) {
      query = query.where('cs.status', '=', criteria.status);
    }

    if (criteria.search) {
      query = query.where((eb) =>
        eb.or([
          eb('cs.receiver_name', 'ilike', `%\${criteria.search}%`),
          eb('cs.receiver_phone', 'ilike', `%\${criteria.search}%`),
        ]),
      );
    }

    const limit = criteria.pagination?.limit || 10;
    query = query.limit(limit + 1).orderBy('cs.id', 'desc');

    if (criteria.pagination?.cursor) {
      query = query.where('cs.id', '<', criteria.pagination.cursor);
    }

    const records = await query.execute();

    let hasNextPage = false;
    let nextCursor: string | null = null;

    if (records.length > limit) {
      hasNextPage = true;
      const nextItem = records.pop();
      nextCursor = nextItem?.id || null;
    }

    const mappedData = records.map((record) => {
      let parcels: any[] = [];
      if (Array.isArray(record.parcels)) {
        parcels = record.parcels.filter((p: any) => p !== null);
      }
      return CustomerShipmentPersistenceMapper.toDomain({
        ...record,
        parcel: parcels,
      } as any);
    });

    const meta: CursorPaginationMeta = {
      nextCursor,
      previousCursor: null, // Since we only do forward pagination for now
      hasNextPage,
      hasPreviousPage: !!criteria.pagination?.cursor,
    };

    return new CursorPaginatedResponse(mappedData, meta);
  }
}
