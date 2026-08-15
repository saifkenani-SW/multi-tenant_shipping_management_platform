import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import type { ShipmentRequestMergedCriteria } from '../../application/dtos/requests/shipment-request-merged-criteria.interface';
import { ShipmentRequestResponseDto } from '../../application/dtos/responses/shipment-request.response.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ShipmentRequestScopeInterface } from '../../../authorization/scopes/shipment-request-scope.interface';
import { Cacheable } from '../../../../../infrastructure/cache/decorators/Cacheable';
import {
  SHIPMENT_REQUEST_CACHE_KEYS,
  SHIPMENT_REQUEST_CACHE_TTL,
} from '../../constants/shipment-request.cache.constants';

@Injectable()
export class ShipmentRequestQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.LIST,
    ttl: SHIPMENT_REQUEST_CACHE_TTL.LIST,
    keyBuilder: (criteria: ShipmentRequestMergedCriteria) => [
      SHIPMENT_REQUEST_CACHE_KEYS.LIST,
      criteria.customerProfileId || 'none',
      criteria.targetTenantId || 'none',
      criteria.originGlobalLocationId || 'none',
      criteria.destinationGlobalLocationId || 'none',
      criteria.senderPhone || 'none',
      criteria.receiverPhone || 'none',
      criteria.status || 'none',
      criteria.quotationTenantId || 'none',
      criteria.quotationOrgUnitIds?.join(',') || 'none',
      criteria.limit || 20,
      criteria.cursor || 'none',
    ],
  })
  async findMany(
    criteria: ShipmentRequestMergedCriteria,
  ): Promise<CursorPaginatedResponse<any>> {
    let query: any = this.kysely
      .selectFrom('shipment_request as sr')
      .select([
        'sr.id',
        'sr.customer_profile_id',
        'sr.target_tenant_id',
        'sr.origin_global_location_id',
        'sr.destination_global_location_id',
        'sr.sender_name',
        'sr.sender_phone',
        'sr.receiver_name',
        'sr.receiver_phone',
        'sr.expected_pieces_count',
        'sr.expected_total_weight_kg',
        'sr.status',
        'sr.approved_quotation_id',
        'sr.created_at',
        'sr.updated_at',
      ]);

    // Apply merged filters
    if (criteria.customerProfileId) {
      query = query.where(
        'sr.customer_profile_id',
        '=',
        criteria.customerProfileId,
      );
    }

    if (criteria.originGlobalLocationId) {
      query = query.where(
        'sr.origin_global_location_id',
        '=',
        criteria.originGlobalLocationId,
      );
    }

    if (criteria.destinationGlobalLocationId) {
      query = query.where(
        'sr.destination_global_location_id',
        '=',
        criteria.destinationGlobalLocationId,
      );
    }

    if (criteria.senderPhone) {
      query = query.where('sr.sender_phone', '=', criteria.senderPhone);
    }

    if (criteria.receiverPhone) {
      query = query.where('sr.receiver_phone', '=', criteria.receiverPhone);
    }

    if (criteria.status) {
      query = query.where('sr.status', '=', criteria.status as any);
    }

    if (
      criteria.targetTenantId ||
      criteria.quotationTenantId ||
      (criteria.quotationOrgUnitIds && criteria.quotationOrgUnitIds.length > 0)
    ) {
      query = query.where((eb) => {
        const orConditions: any[] = [];

        if (criteria.targetTenantId) {
          orConditions.push(
            eb('sr.target_tenant_id', '=', criteria.targetTenantId!),
          );
        }

        if (
          criteria.quotationTenantId ||
          (criteria.quotationOrgUnitIds &&
            criteria.quotationOrgUnitIds.length > 0)
        ) {
          let subquery = eb
            .selectFrom('quotation as q')
            .select('q.id' as any)
            .whereRef('q.shipment_request_id' as any, '=', 'sr.id' as any);

          if (criteria.quotationTenantId) {
            subquery = subquery.where(
              'q.tenant_id' as any,
              '=',
              criteria.quotationTenantId,
            );
          }

          if (
            criteria.quotationOrgUnitIds &&
            criteria.quotationOrgUnitIds.length > 0
          ) {
            subquery = subquery.where(
              'q.origin_org_unit_id' as any,
              'in',
              criteria.quotationOrgUnitIds,
            );
          }

          orConditions.push(eb.exists(subquery));
        }

        if (orConditions.length > 0) {
          return eb.or(orConditions);
        }

        return eb.and([]);
      });
    }

    if (criteria.cursor) {
      query = query.where('sr.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('sr.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    const mappedRecords = records.map((record) => ({
      id: record.id,
      customerProfileId: record.customer_profile_id,
      targetTenantId: record.target_tenant_id ?? null,
      originGlobalLocationId: record.origin_global_location_id,
      destinationGlobalLocationId: record.destination_global_location_id,
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      expectedPiecesCount: record.expected_pieces_count,
      expectedTotalWeightKg: Number(record.expected_total_weight_kg),
      status: record.status as string,
      approvedQuotationId: record.approved_quotation_id ?? null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    if (mappedRecords.length === 0) {
      return new CursorPaginatedResponse<any>([], {
        hasNextPage: false,
        hasPreviousPage: !!criteria.cursor,
        nextCursor: null,
        previousCursor: null,
      });
    }

    const endCursor =
      mappedRecords.length > 0
        ? mappedRecords[mappedRecords.length - 1].id
        : null;

    return new CursorPaginatedResponse<any>(mappedRecords, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor: endCursor,
      previousCursor: null,
    });
  }

  @Cacheable({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.DETAILS,
    ttl: SHIPMENT_REQUEST_CACHE_TTL.DETAILS,
  })
  async findById(id: string): Promise<any | null> {
    let query = this.kysely
      .selectFrom('shipment_request as sr')
      .select([
        'sr.id',
        'sr.customer_profile_id',
        'sr.target_tenant_id',
        'sr.origin_global_location_id',
        'sr.destination_global_location_id',
        'sr.sender_name',
        'sr.sender_phone',
        'sr.receiver_name',
        'sr.receiver_phone',
        'sr.expected_pieces_count',
        'sr.expected_total_weight_kg',
        'sr.status',
        'sr.approved_quotation_id',
        'sr.created_at',
        'sr.updated_at',
      ])
      .where('sr.id', '=', id);

    const record = await query.executeTakeFirst();
    if (!record) return null;

    return {
      id: record.id,
      customerProfileId: record.customer_profile_id,
      targetTenantId: record.target_tenant_id ?? null,
      originGlobalLocationId: record.origin_global_location_id,
      destinationGlobalLocationId: record.destination_global_location_id,
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      expectedPiecesCount: record.expected_pieces_count,
      expectedTotalWeightKg: Number(record.expected_total_weight_kg),
      status: record.status as string,
      approvedQuotationId: record.approved_quotation_id ?? null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
