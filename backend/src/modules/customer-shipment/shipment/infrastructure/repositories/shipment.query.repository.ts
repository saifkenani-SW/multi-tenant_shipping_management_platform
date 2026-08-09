import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  CUSTOMER_SHIPMENT_CACHE_KEYS,
  CUSTOMER_SHIPMENT_CACHE_TTL,
} from '../../../constants/customer-shipment.cache.constants';
import type { ShipmentMergedCriteria } from '../../application/dtos/requests/shipment-merged-criteria.interface';
import { CustomerShipment } from '../../domain/entities/customer-shipment.entity';

const SHIPMENT_COLUMNS = [
  'cs.id',
  'cs.version',
  'cs.tenant_id',
  'cs.sender_national_id',
  'cs.sender_customer_profile_id',
  'cs.receiver_customer_profile_id',
  'cs.shipment_request_id',
  'cs.approved_quotation_id',
  'cs.origin_org_unit_id',
  'cs.destination_org_unit_id',
  'cs.service_level',
  'cs.receiver_name',
  'cs.receiver_phone',
  'cs.payment_responsibility',
  'cs.total_chargeable_weight_kg',
  'cs.status',
  'cs.created_at',
  'cs.updated_at',
] as const;

@Injectable()
export class ShipmentQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.LIST,
    ttl: CUSTOMER_SHIPMENT_CACHE_TTL.LIST,
    keyBuilder: (criteria: ShipmentMergedCriteria) => [
      CUSTOMER_SHIPMENT_CACHE_KEYS.LIST,
      criteria.tenantId || 'none',
      criteria.senderCustomerProfileId || 'none',
      criteria.originOrgUnitId || 'none',
      (criteria.originOrgUnitIds || []).join(',') || 'none',
      criteria.destinationOrgUnitId || 'none',
      criteria.status || 'none',
      criteria.receiverPhone || 'none',
      criteria.limit || 20,
      criteria.cursor || 'none',
    ],
  })
  async findMany(
    criteria: ShipmentMergedCriteria,
  ): Promise<CursorPaginatedResponse<any>> {
    let query: any = this.kysely
      .selectFrom('customer_shipment as cs')
      .select([...SHIPMENT_COLUMNS])
      .select((eb: any) =>
        eb
          .selectFrom('parcel as p')
          .select((inner: any) => inner.fn.count('p.id').as('count'))
          .whereRef('p.customer_shipment_id', '=', 'cs.id')
          .as('parcel_count'),
      );

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

    if (criteria.originOrgUnitId) {
      query = query.where(
        'cs.origin_org_unit_id',
        '=',
        criteria.originOrgUnitId,
      );
    }

    // An employee is limited to the org units they are assigned to. An empty
    // list means no assignment at all, which must match nothing rather than
    // silently matching everything.
    if (criteria.originOrgUnitIds) {
      query = criteria.originOrgUnitIds.length
        ? query.where('cs.origin_org_unit_id', 'in', criteria.originOrgUnitIds)
        : query.where((eb: any) => eb.val(false));
    }

    if (criteria.destinationOrgUnitId) {
      query = query.where(
        'cs.destination_org_unit_id',
        '=',
        criteria.destinationOrgUnitId,
      );
    }

    if (criteria.status) {
      query = query.where('cs.status', '=', criteria.status);
    }

    if (criteria.receiverPhone) {
      query = query.where('cs.receiver_phone', '=', criteria.receiverPhone);
    }

    if (criteria.cursor) {
      query = query.where('cs.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('cs.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      records.length > 0 ? records[records.length - 1].id : null;

    return new CursorPaginatedResponse<any>(records, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor,
      previousCursor: null,
    });
  }

  async findRawById(id: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('customer_shipment as cs')
      .select([...SHIPMENT_COLUMNS])
      .select((eb: any) =>
        eb
          .selectFrom('parcel as p')
          .select((inner: any) => inner.fn.count('p.id').as('count'))
          .whereRef('p.customer_shipment_id', '=', 'cs.id')
          .as('parcel_count'),
      )
      .where('cs.id', '=', id)
      .executeTakeFirst();

    return record ?? null;
  }

  /**
   * Loads the aggregate so a caller can ask it to decide a transition.
   * Carries `version` for the optimistic-locking write that follows.
   */
  async findAggregateById(id: string): Promise<CustomerShipment | null> {
    const record = await this.findRawById(id);
    if (!record) return null;

    return CustomerShipment.restore({
      id: record.id,
      version: record.version,
      tenantId: record.tenant_id,
      senderCustomerProfileId: record.sender_customer_profile_id,
      receiverCustomerProfileId: record.receiver_customer_profile_id,
      senderNationalId: record.sender_national_id,
      shipmentRequestId: record.shipment_request_id,
      approvedQuotationId: record.approved_quotation_id,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      serviceLevel: record.service_level,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      paymentResponsibility: record.payment_responsibility,
      totalChargeableWeightKg:
        record.total_chargeable_weight_kg === null
          ? null
          : Number(record.total_chargeable_weight_kg),
      status: record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }
}
