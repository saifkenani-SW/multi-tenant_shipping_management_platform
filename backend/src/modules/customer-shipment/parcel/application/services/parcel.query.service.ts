import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthorizationFacade,
  Authorize,
} from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ParcelPolicy } from '../../domain/authorization/policies/parcel.policy';
import { ParcelAction } from '../../domain/authorization/actions/parcel.action';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ParcelQueryRepository } from '../../infrastructure/repositories/parcel.query.repository';
import { ParcelQueryDto } from '../dtos/requests/parcel-query.dto';
import type { ParcelMergedCriteria } from '../dtos/requests/parcel-merged-criteria.interface';
import { ParcelResponseDto } from '../dtos/responses/parcel.response.dto';
import { ParcelMapper } from '../mappers/parcel.mapper';
import { Parcel } from '../../domain/entities/parcel.entity';
import { ParcelVisibilityScope } from '../../domain/authorization/scopes/parcel-visibility.scope';
import type { ParcelScopeInterface } from '../../domain/authorization/scopes/parcel-scope.interface';
import { ShipmentQueryService } from '../../../shipment/application/services/shipment.query.service';
import {
  GetParcelStatisticsResponseDto,
  ParcelTenantStatsDto,
  ParcelOrgUnitStatsDto,
} from '../dtos/responses/parcel-statistics.response.dto';
import type { ParcelStatisticsCriteria } from '../dtos/requests/parcel-statistics-criteria.interface';

import { ParcelTrackingResponseDto } from '../dtos/responses/parcel-tracking.response.dto';
import { TrackingFacade } from '../../../../tracking/application/facades/tracking.facade';
import { ProofOfDeliveryQueryService } from '../../../proof-of-delivery/application/services/proof-of-delivery.query.service';
import { ProofOfDeliveryResponseDto } from '../../../proof-of-delivery/application/dtos/responses/proof-of-delivery.response.dto';
import { CACHE_FACADE } from '../../../../../core/cache/tokens/cache.tokens';
import { ReturnCapabilities } from '../../../../../packages/authorization';
import { ParcelCapabilityBuilder } from '../capabilities/parcel-capability.builder';
import { Readable } from 'stream';
import type { IStorageProvider } from '../../../../../packages/storage/src';
import { STORAGE_PROVIDER } from '../../../../../packages/storage/src';
import { extname } from 'path';
import * as mime from 'mime-types';

@Injectable()
export class ParcelQueryService {
  constructor(
    @Inject(forwardRef(() => ShipmentQueryService))
    private readonly shipmentQueryService: ShipmentQueryService,
    private readonly queryRepository: ParcelQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly mapper: ParcelMapper,
    private readonly trackingFacade: TrackingFacade,
    private readonly podQueryService: ProofOfDeliveryQueryService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  /**
   * Lists the parcels of one shipment.
   *
   * The scope constraints are mandatory: a caller filter may narrow them but a
   * conflicting value is refused outright rather than quietly ignored.
   */
  async findByShipment(
    customerShipmentId: string,
    filter: ParcelQueryDto,
  ): Promise<CursorPaginatedResponse<ParcelResponseDto>> {
    // Authorize by fetching the shipment.
    // ShipmentQueryService.findById evaluates visibility scopes implicitly.
    await this.shipmentQueryService.findById(customerShipmentId);

    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });

    // We no longer apply ParcelVisibilityScope to the query because the shipment auth suffices.
    const merged: ParcelMergedCriteria = {
      customerShipmentId,
      statuses: filter.statuses,
      condition: filter.condition,
      currentOrgUnitId: filter.currentOrgUnitId,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    const result = await this.queryRepository.findMany(merged);

    return new CursorPaginatedResponse(
      (result.data as any[]).map((row) => this.mapper.toResponse(row)),
      { ...result.meta, scope },
    );
  }

  @ReturnCapabilities({
    policy: ParcelCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (id: string) => ({ id }),
  })
  async findById(id: string): Promise<ParcelResponseDto> {
    const record = await this.findRawOrThrow(id);
    return this.mapper.toResponse(record);
  }

  /**
   * Lists all parcels subject to the caller's visibility scope.
   * Useful for branch employees viewing parcels currently at their unit,
   * or tenant admins viewing all parcels.
   */
  async findAll(
    filter: ParcelQueryDto,
  ): Promise<CursorPaginatedResponse<ParcelResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });

    this.assertFilterAllowed(
      filter.tenantId,
      scope.parcel?.tenant_id,
      'tenant',
    );

    const merged: ParcelMergedCriteria = {
      tenantId: scope.parcel?.tenant_id || filter.tenantId,
      scopeOrgUnitIds: scope.parcel?.org_unit_ids,
      customerPhone: scope.shipment?.sender_phone, // sender_phone and receiver_phone are identical in scope
      statuses: filter.statuses,
      condition: filter.condition,
      currentOrgUnitId: filter.currentOrgUnitId,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    if (scope.parcel?.org_unit_ids && filter.currentOrgUnitId) {
      if (!scope.parcel.org_unit_ids.includes(filter.currentOrgUnitId)) {
        throw new ForbiddenException(
          'You can only filter by an organization unit within your scope',
        );
      }
    }

    const result = await this.queryRepository.findMany(merged);

    return new CursorPaginatedResponse(
      (result.data as any[]).map((row) => this.mapper.toResponse(row)),
      { ...result.meta, scope },
    );
  }

  /**
   * Global Parcel Statistics Summary (No input filters allowed)
   * The visibility scope controls all constraints.
   */
  async getStatistics(): Promise<GetParcelStatisticsResponseDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });

    const criteria: ParcelStatisticsCriteria = {
      tenantId: scope.parcel?.tenant_id,
      scopeOrgUnitIds: scope.parcel?.org_unit_ids,
    };

    const records = await this.queryRepository.getStatistics(criteria);

    // O(N) Mapping using Maps
    const response: GetParcelStatisticsResponseDto = {
      total: 0,
      tenants: [],
    };

    // Nested Map for O(N) mapping
    // tenantId -> { tenant, orgUnitsMap }
    const tenantMap = new Map<
      string,
      {
        tenant: ParcelTenantStatsDto;
        orgUnits: Map<string, ParcelOrgUnitStatsDto>;
      }
    >();

    for (const row of records) {
      const countNum = Number(row.count);
      if (!Number.isSafeInteger(countNum) || countNum < 0) {
        throw new Error(
          `Invalid statistics count value returned for parcel aggregation: ${row.count}`,
        );
      }

      let tenantEntry = tenantMap.get(row.tenantId);
      if (!tenantEntry) {
        tenantEntry = {
          tenant: {
            tenantId: row.tenantId,
            tenantName: row.tenantName,
            total: 0,
            orgUnits: [],
          },
          orgUnits: new Map<string, ParcelOrgUnitStatsDto>(),
        };
        tenantMap.set(row.tenantId, tenantEntry);
      }

      // Ensure org unit ID exists (current or destination)
      if (!row.orgUnitId) continue;

      let orgUnitStats = tenantEntry.orgUnits.get(row.orgUnitId);
      if (!orgUnitStats) {
        orgUnitStats = {
          orgUnitId: row.orgUnitId,
          orgUnitName: row.orgUnitName,
          current: { total: 0, stats: [] },
          incoming: { total: 0, stats: [] },
        };
        tenantEntry.orgUnits.set(row.orgUnitId, orgUnitStats);
      }

      const statItem = {
        status: row.status as any,
        condition: row.condition as any,
        count: countNum,
      };

      // Rules:
      // response.total = sum(CURRENT)
      // tenant.total = sum(CURRENT for tenant)
      // orgUnit.current.total = sum(CURRENT stats)
      // orgUnit.incoming.total = sum(INCOMING stats)
      if (row.direction === 'CURRENT') {
        response.total += countNum;
        tenantEntry.tenant.total += countNum;
        orgUnitStats.current.total += countNum;
        orgUnitStats.current.stats.push(statItem);
      } else if (row.direction === 'INCOMING') {
        orgUnitStats.incoming.total += countNum;
        orgUnitStats.incoming.stats.push(statItem);
      }
    }

    // Convert Maps to nested arrays
    response.tenants = Array.from(tenantMap.values()).map((entry) => {
      entry.tenant.orgUnits = Array.from(entry.orgUnits.values());
      return entry.tenant;
    });

    return response;
  }

  /**
   * Tracking lookup. Authentication is required by the controller: shipment
   * data belongs to the company and is not public.
   */
  @ReturnCapabilities({
    policy: ParcelCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<ParcelTrackingResponseDto> {
    const record =
      await this.queryRepository.findRawByTrackingNumber(trackingNumber);

    if (!record) {
      throw new NotFoundException('Parcel not found');
    }

    const baseDto = this.mapper.toResponse(record);
    const history = await this.trackingFacade.getParcelHistory(record.id);

    return {
      ...baseDto,
      history,
    };
  }

  /**
   * Parcels for a set of ids, narrowed to what the caller may see.
   *
   * Batched on purpose: reading them one id at a time authorizes each row
   * with its own extra query, so a forty-parcel manifest would cost eighty
   * round trips. Rows outside the scope are dropped rather than throwing —
   * one unreadable parcel should not blank out a whole manifest.
   */
  async getParcelsByIds(ids: string[]): Promise<ParcelResponseDto[]> {
    if (ids.length === 0) return [];

    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });
    const records = await this.queryRepository.findRawByIds(ids);

    return records
      .filter((record) => this.isWithinScope(record, scope))
      .map((record) => this.mapper.toResponse(record));
  }

  /** The same visibility rule the filtered queries apply, checked in memory. */
  private isWithinScope(record: any, scope: ParcelScopeInterface): boolean {
    const parcel = scope.parcel;

    if (parcel?.tenant_id && record.tenant_id !== parcel.tenant_id) {
      return false;
    }

    // An employee sees a parcel sitting at one of their units or heading to it.
    if (parcel?.org_unit_ids?.length) {
      const units = parcel.org_unit_ids;
      const reachable =
        units.includes(record.current_org_unit_id) ||
        units.includes(record.destination_org_unit_id);

      if (!reachable) return false;
    }

    const shipment = scope.shipment;
    if (shipment?.sender_phone || shipment?.receiver_phone) {
      const isParty =
        record.sender_phone === shipment.sender_phone ||
        record.receiver_phone === shipment.receiver_phone;

      if (!isParty) return false;
    }

    return true;
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  async getProofOfDelivery(
    trackingNumber: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    return this.podQueryService.findByTrackingNumber(trackingNumber);
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  async getPhotoStream(
    trackingNumber: string,
    photoType: 'signature' | 'idPhoto' | 'parcelPhoto' | 'additionalPhoto',
    index: number = 0,
  ): Promise<{ stream: Readable; mimeType: string }> {
    return this.podQueryService.getPhotoStream(
      trackingNumber,
      photoType,
      index,
    );
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  async getLabelStream(
    trackingNumber: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const record = await this.queryRepository.findRawByTrackingNumber(trackingNumber);

    if (!record) {
      throw new NotFoundException('Parcel not found');
    }

    if (!record.label_key) {
      throw new NotFoundException('Label not found for this parcel');
    }

    const stream = await this.storageProvider.get(record.label_key);
    const mimeType = mime.lookup(extname(record.label_key)) || 'application/octet-stream';

    return { stream, mimeType };
  }

  async findAggregateOrThrow(id: string): Promise<Parcel> {
    const parcel = await this.queryRepository.findAggregateById(id);

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    return parcel;
  }

  /**
   * Resolves a tracking number (scanned from QR / barcode) to the domain
   * aggregate carrying its optimistic-lock version. Used exclusively by write
   * paths that originate from a physical scan, never by a UI that has a UUID.
   */
  async findAggregateByTrackingNumberOrThrow(
    trackingNumber: string,
  ): Promise<Parcel> {
    const parcel =
      await this.queryRepository.findAggregateByTrackingNumber(trackingNumber);

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    return parcel;
  }

  async findRawOrThrow(id: string): Promise<any> {
    const record = await this.queryRepository.findRawById(id);

    if (!record) {
      throw new NotFoundException('Parcel not found');
    }

    return record;
  }

  /** Used by the shipment side to derive a shipment status from its parcels. */
  async getStatusesForShipment(customerShipmentId: string) {
    return this.queryRepository.findStatusesByShipmentId(customerShipmentId);
  }

  async getRawParcelsForShipment(customerShipmentId: string): Promise<any[]> {
    return this.queryRepository.findByShipmentId(customerShipmentId);
  }

  /** Guards a filter value that conflicts with a mandatory scope constraint. */
  assertFilterAllowed(
    filterValue: string | undefined,
    scopeValue: string | undefined,
    label: string,
  ): void {
    if (scopeValue && filterValue && filterValue !== scopeValue) {
      throw new ForbiddenException(`You can only filter by your own ${label}.`);
    }
  }
}
