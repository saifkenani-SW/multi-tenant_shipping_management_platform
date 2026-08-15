import { Injectable } from '@nestjs/common';
import { TransportManifestQueryRepository } from '../../infrastructure/repositories/transport-manifest-query.repository';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestNotFoundException } from '../../domain/exceptions/manifest-not-found.exception';
import { ManifestItemNotFoundException } from '../../domain/exceptions/manifest-item-not-found.exception';
import { ManifestQueryDto } from '../dtos/requests/manifest-query.dto';
import { ManifestDetailsDto } from '../dtos/responses/manifest-details.dto';
import { ManifestItemDto } from '../dtos/responses/manifest-item.dto';
import { PaginatedManifestListDto } from '../dtos/responses/manifest-list.dto';
import { ManifestResponseMapper } from '../mappers/manifest-response.mapper';
import { PARCEL_LOOKUP } from '../../../contracts/parcel-lookup';
import { Inject } from '@nestjs/common';
import type { ParcelLookup, ParcelSummary } from '../../../contracts/parcel-lookup';
import { ManifestQueryCriteria } from '../builders/query/manifest-query-criteria';
import { OffsetPaginationBuilder } from '../../../../../common/pagination';
import { AuthorizationFacade } from '../../../../../packages/authorization/facade/authorization.facade';
import { ManifestVisibilityScope } from '../../domain/authorization/scopes/manifest-visibility.scope';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class ManifestQueryService {
  constructor(
    private readonly queryRepository: TransportManifestQueryRepository,
    private readonly responseMapper: ManifestResponseMapper,
    @Inject(PARCEL_LOOKUP) private readonly parcelLookup: ParcelLookup,
    private readonly authorizationFacade: AuthorizationFacade,
  ) {}

  async findManifests(
    tenantId: string | undefined,
    query: ManifestQueryDto,
  ): Promise<PaginatedManifestListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: ManifestVisibilityScope,
    });

    if (tenantId && scope?.tenantId && tenantId !== scope.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const criteria: ManifestQueryCriteria = {
      tenantId: scope?.tenantId || tenantId || query.tenantId,
      scopeOrgUnitIds: scope?.orgUnitIds,
      driverId: scope?.driverId || query.driverId,
      status: query.status,
      tripId: query.tripId,
      originOrgUnitId: query.originOrgUnitId,
      destinationOrgUnitId: query.destinationOrgUnitId,
      pagination: OffsetPaginationBuilder.build(query),
    };

    const [records, total] = await this.queryRepository.findMany(criteria);

    return this.responseMapper.toPaginatedListDto(
      records,
      total,
      criteria.pagination,
    );
  }

  async getManifestDetails(
    tenantId: string | undefined,
    id: string,
  ): Promise<ManifestDetailsDto> {
    const manifest = await this.findManifestOrThrow(tenantId, id);
    const items = await this.queryRepository.findItems(id);

    return this.responseMapper.toDetailsDto(
      manifest,
      items,
      await this.loadParcels(items),
    );
  }

  async getManifestItems(
    tenantId: string | undefined,
    manifestId: string,
  ): Promise<ManifestItemDto[]> {
    await this.findManifestOrThrow(tenantId, manifestId);
    const items = await this.queryRepository.findItems(manifestId);
    const parcels = await this.loadParcels(items);

    return items.map(
      (item) => this.responseMapper.toItemDto(item, parcels.get(item.parcelId)),
    );
  }

  /**
   * Returns manifests in READY_FOR_DISPATCH state with no trip linked.
   * Used by the GET /manifests/available endpoint.
   */
  async findAvailableForBooking(tenantId: string) {
    return this.queryRepository.findAvailable(tenantId);
  }

  private async loadParcels(
    items: ManifestItem[],
  ): Promise<Map<string, ParcelSummary>> {
    if (items.length === 0) return new Map();

    try {
      const parcels = await this.parcelLookup.getParcelsByIds(
        items.map((item) => item.parcelId),
      );

      return new Map(parcels.map((parcel) => [parcel.id, parcel]));
    } catch {
      return new Map();
    }
  }

  async findManifestOrThrow(
    tenantId: string | undefined,
    id: string,
  ): Promise<TransportManifest> {
    const manifest = await this.queryRepository.findById(tenantId, id);

    if (!manifest) {
      throw new ManifestNotFoundException();
    }

    return manifest;
  }

  async findItemOrThrow(
    manifestId: string,
    itemId: string,
  ): Promise<ManifestItem> {
    const item = await this.queryRepository.findItemById(manifestId, itemId);

    if (!item) {
      throw new ManifestItemNotFoundException();
    }

    return item;
  }

  async isParcelInActiveManifest(
    tenantId: string,
    parcelId: string,
    excludeManifestId?: string,
  ): Promise<boolean> {
    return this.queryRepository.isParcelInActiveManifest(
      tenantId,
      parcelId,
      excludeManifestId,
    );
  }

  async existsItemForParcel(
    manifestId: string,
    parcelId: string,
  ): Promise<boolean> {
    return this.queryRepository.existsItemForParcel(manifestId, parcelId);
  }
}
