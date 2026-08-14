import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { ParcelStatus } from '@prisma/client';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  CUSTOMER_SHIPMENT_CACHE_KEYS,
  CUSTOMER_SHIPMENT_CACHE_TTL,
} from '../../../constants/customer-shipment.cache.constants';
import type { ParcelMergedCriteria } from '../../application/dtos/requests/parcel-merged-criteria.interface';
import { Parcel } from '../../domain/entities/parcel.entity';

const PARCEL_COLUMNS = [
  'p.id',
  'p.version',
  'p.tenant_id',
  'p.customer_shipment_id',
  'p.tracking_number',
  'p.description',
  'p.category',
  'p.parcel_type',
  'p.is_fragile',
  'p.requires_upright_handling',
  'p.temperature_sensitive',
  'p.actual_weight_kg',
  'p.length_cm',
  'p.width_cm',
  'p.height_cm',
  'p.volumetric_weight_kg',
  'p.current_status',
  'p.current_condition',
  'p.current_org_unit_id',
  'p.destination_org_unit_id',
  'p.label_key',
  'p.created_at',
  'p.updated_at',
] as const;

@Injectable()
export class ParcelQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_LIST,
    ttl: CUSTOMER_SHIPMENT_CACHE_TTL.LIST,
    keyBuilder: (criteria: ParcelMergedCriteria) => [
      CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_LIST,
      criteria.tenantId || 'none',
      criteria.customerShipmentId || 'none',
      (criteria.scopeOrgUnitIds || []).join(',') || 'none',
      criteria.customerPhone || 'none',
      (criteria.statuses || []).join(',') || 'none',
      criteria.condition || 'none',
      criteria.currentOrgUnitId || 'none',
      criteria.limit || 20,
      criteria.cursor || 'none',
    ],
  })
  async findMany(
    criteria: ParcelMergedCriteria,
  ): Promise<CursorPaginatedResponse<any>> {
    let query: any = this.kysely
      .selectFrom('parcel as p')
      .select([...PARCEL_COLUMNS]);

    if (criteria.customerPhone) {
      query = query
        .innerJoin(
          'customer_shipment as cs',
          'cs.id',
          'p.customer_shipment_id',
        )
        .where((eb: any) =>
          eb.or([
            eb('cs.sender_phone', '=', criteria.customerPhone!),
            eb('cs.receiver_phone', '=', criteria.customerPhone!),
          ]),
        );
    }

    if (criteria.tenantId) {
      query = query.where('p.tenant_id', '=', criteria.tenantId);
    }

    if (criteria.customerShipmentId) {
      query = query.where(
        'p.customer_shipment_id',
        '=',
        criteria.customerShipmentId,
      );
    }

    if (criteria.statuses && criteria.statuses.length > 0) {
      query = query.where('p.current_status', 'in', criteria.statuses);
    }

    if (criteria.condition) {
      query = query.where('p.current_condition', '=', criteria.condition);
    }

    if (criteria.currentOrgUnitId) {
      query = query.where(
        'p.current_org_unit_id',
        '=',
        criteria.currentOrgUnitId,
      );
    }

    if (criteria.scopeOrgUnitIds) {
      if (criteria.scopeOrgUnitIds.length > 0) {
        query = query.where((eb: any) =>
          eb.or([
            eb('p.current_org_unit_id', 'in', criteria.scopeOrgUnitIds),
            eb('p.destination_org_unit_id', 'in', criteria.scopeOrgUnitIds),
          ]),
        );
      } else {
        query = query.where((eb: any) => eb.val(false));
      }
    }

    if (criteria.cursor) {
      query = query.where('p.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('p.id', 'desc').limit(limit + 1);

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

  /** All parcels of one shipment, unpaginated — used to derive shipment status. */
  async findByShipmentId(customerShipmentId: string): Promise<any[]> {
    return this.kysely
      .selectFrom('parcel as p')
      .select([...PARCEL_COLUMNS])
      .where('p.customer_shipment_id', '=', customerShipmentId)
      .orderBy('p.id', 'asc')
      .execute();
  }

  async findStatusesByShipmentId(
    customerShipmentId: string,
  ): Promise<ParcelStatus[]> {
    const rows = await this.kysely
      .selectFrom('parcel')
      .select('current_status')
      .where('customer_shipment_id', '=', customerShipmentId)
      .execute();

    return rows.map((r) => r.current_status);
  }

  /**
   * Raw row joined with the owning shipment so a CASL condition can check
   * either the tenant or the sending customer without a second query.
   */
  @Cacheable({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
    ttl: CUSTOMER_SHIPMENT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [
      CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
      id,
    ],
  })
  async findRawById(id: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('parcel as p')
      .innerJoin('customer_shipment as cs', 'cs.id', 'p.customer_shipment_id')
      .select([...PARCEL_COLUMNS])
      .select(['cs.sender_phone', 'cs.receiver_phone', 'cs.origin_org_unit_id'])
      .where('p.id', '=', id)
      .executeTakeFirst();

    return record ?? null;
  }

  @Cacheable({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
    ttl: CUSTOMER_SHIPMENT_CACHE_TTL.DETAILS,
    keyBuilder: (trackingNumber: string) => [
      CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
      trackingNumber,
    ],
  })
  /**
   * Raw rows for a set of ids, joined like findRawById.
   *
   * One query for the whole set: reading a manifest's parcels one id at a
   * time turns a forty-parcel screen into eighty round trips.
   */
  async findRawByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];

    return this.kysely
      .selectFrom('parcel as p')
      .innerJoin('customer_shipment as cs', 'cs.id', 'p.customer_shipment_id')
      .select([...PARCEL_COLUMNS])
      .select(['cs.sender_phone', 'cs.receiver_phone', 'cs.origin_org_unit_id'])
      .where('p.id', 'in', ids)
      .execute();
  }

  async findRawByTrackingNumber(trackingNumber: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('parcel as p')
      .innerJoin('customer_shipment as cs', 'cs.id', 'p.customer_shipment_id')
      .select([...PARCEL_COLUMNS])
      .select(['cs.sender_phone', 'cs.receiver_phone', 'cs.origin_org_unit_id'])
      .where('p.tracking_number', '=', trackingNumber)
      .executeTakeFirst();

    return record ?? null;
  }

  /** Loads the aggregate, carrying `version` for the optimistic-locking write. */
  async findAggregateById(id: string): Promise<Parcel | null> {
    const record = await this.findRawById(id);
    if (!record) return null;

    return Parcel.restore({
      id: record.id,
      version: record.version,
      tenantId: record.tenant_id,
      customerShipmentId: record.customer_shipment_id,
      trackingNumber: record.tracking_number,
      currentStatus: record.current_status,
      currentCondition: record.current_condition,
      currentOrgUnitId: record.current_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      labelKey: record.label_key,
      senderPhone: record.sender_phone,
      receiverPhone: record.receiver_phone,
      originOrgUnitId: record.origin_org_unit_id,
    });
  }

  /**
   * Loads the aggregate by tracking number.
   * Used by employee write operations (status update) where the scanning device
   * provides the tracking number printed on the QR / barcode, never the UUID.
   */
  async findAggregateByTrackingNumber(
    trackingNumber: string,
  ): Promise<Parcel | null> {
    const record = await this.findRawByTrackingNumber(trackingNumber);
    if (!record) return null;

    return Parcel.restore({
      id: record.id,
      version: record.version,
      tenantId: record.tenant_id,
      customerShipmentId: record.customer_shipment_id,
      trackingNumber: record.tracking_number,
      currentStatus: record.current_status,
      currentCondition: record.current_condition,
      currentOrgUnitId: record.current_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      labelKey: record.label_key,
      senderPhone: record.sender_phone,
      receiverPhone: record.receiver_phone,
      originOrgUnitId: record.origin_org_unit_id,
    });
  }


  async existsByTrackingNumber(trackingNumber: string): Promise<boolean> {
    const record = await this.kysely
      .selectFrom('parcel')
      .select('id')
      .where('tracking_number', '=', trackingNumber)
      .executeTakeFirst();

    return Boolean(record);
  }
}
