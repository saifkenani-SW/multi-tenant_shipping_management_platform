import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { RequestStatus } from '@prisma/client';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { IShipmentRequestQueryRepository } from '../interfaces/shipment-request.query.repository.interface';
import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import {
  SHIPMENT_REQUEST_CACHE_KEYS,
  SHIPMENT_REQUEST_CACHE_TTL,
} from '../constants/shipment-request.cache.constants';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import { Quotation } from '../domain/quotation.entity';

const SHIPMENT_REQUEST_COLUMNS = [
  'id',
  'customer_profile_id',
  'target_tenant_id',
  'sender_name',
  'sender_phone',
  'sender_address',
  'receiver_name',
  'receiver_phone',
  'receiver_address',
  'expected_pieces_count',
  'expected_total_weight_kg',
  'notes',
  'status',
  'created_at',
  'updated_at',
  'cancelled_at',
  'cancellation_reason',
] as const;

@Injectable()
export class ShipmentRequestQueryRepository
  implements IShipmentRequestQueryRepository
{
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  private toDomain(row: any): ShipmentRequest {
    return new ShipmentRequest(
      row.id,
      row.customer_profile_id,
      row.target_tenant_id,
      row.sender_name,
      row.sender_phone,
      row.sender_address,
      row.receiver_name,
      row.receiver_phone,
      row.receiver_address,
      row.expected_pieces_count,
      row.expected_total_weight_kg !== null
        ? Number(row.expected_total_weight_kg)
        : null,
      row.notes,
      row.status,
      row.created_at,
      row.updated_at,
      row.cancelled_at,
      row.cancellation_reason,
    );
  }

  @Cacheable({
    ttl: SHIPMENT_REQUEST_CACHE_TTL.LIST,
    keyBuilder: (
      customerProfileId: string,
      skip: number,
      take: number,
      status?: RequestStatus,
    ) => [
      SHIPMENT_REQUEST_CACHE_KEYS.LIST,
      'customer',
      customerProfileId,
      skip,
      take,
      status ?? 'any',
    ],
  })
  async findManyForCustomer(
    customerProfileId: string,
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]> {
    let query = this.kysely
      .selectFrom('shipment_request')
      .select(SHIPMENT_REQUEST_COLUMNS)
      .where('customer_profile_id', '=', customerProfileId);
    let countQuery = this.kysely
      .selectFrom('shipment_request')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('customer_profile_id', '=', customerProfileId);

    if (status) {
      query = query.where('status', '=', status);
      countQuery = countQuery.where('status', '=', status);
    }

    query = query.orderBy('created_at', 'desc').offset(skip).limit(take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return [
      items.map((row) => this.toDomain(row)),
      Number(totalCountResult?.count || 0),
    ];
  }

  @Cacheable({
    ttl: SHIPMENT_REQUEST_CACHE_TTL.LIST,
    keyBuilder: (
      tenantId: string,
      skip: number,
      take: number,
      status?: RequestStatus,
    ) => [
      SHIPMENT_REQUEST_CACHE_KEYS.LIST,
      'employee',
      tenantId,
      skip,
      take,
      status ?? 'any',
    ],
  })
  async findManyForEmployee(
    tenantId: string,
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]> {
    let query = this.kysely
      .selectFrom('shipment_request')
      .select(SHIPMENT_REQUEST_COLUMNS)
      .where('target_tenant_id', '=', tenantId);
    let countQuery = this.kysely
      .selectFrom('shipment_request')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('target_tenant_id', '=', tenantId);

    if (status) {
      query = query.where('status', '=', status);
      countQuery = countQuery.where('status', '=', status);
    }

    query = query.orderBy('created_at', 'desc').offset(skip).limit(take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return [
      items.map((row) => this.toDomain(row)),
      Number(totalCountResult?.count || 0),
    ];
  }

  @Cacheable({
    ttl: SHIPMENT_REQUEST_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [SHIPMENT_REQUEST_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<ShipmentRequest | null> {
    const row = await this.kysely
      .selectFrom('shipment_request')
      .select(SHIPMENT_REQUEST_COLUMNS)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;
    return this.toDomain(row);
  }

  @Cacheable({
    ttl: SHIPMENT_REQUEST_CACHE_TTL.QUOTATIONS,
    keyBuilder: (shipmentRequestId: string) => [
      SHIPMENT_REQUEST_CACHE_KEYS.QUOTATIONS,
      shipmentRequestId,
    ],
  })
  async findQuotationsByRequestId(
    shipmentRequestId: string,
  ): Promise<Quotation[]> {
    const rows = await this.kysely
      .selectFrom('quotation')
      .innerJoin('tenant', 'tenant.id', 'quotation.tenant_id')
      .select([
        'quotation.id',
        'quotation.tenant_id',
        'tenant.name as tenant_name',
        'quotation.amount',
        'quotation.status',
        'quotation.valid_until',
        'quotation.notes',
        'quotation.created_at',
      ])
      .where('quotation.shipment_request_id', '=', shipmentRequestId)
      .orderBy('quotation.created_at', 'desc')
      .execute();

    return rows.map(
      (row) =>
        new Quotation(
          row.id,
          row.tenant_id,
          row.tenant_name,
          Number(row.amount),
          row.status,
          row.valid_until,
          row.notes,
          row.created_at,
        ),
    );
  }
}
