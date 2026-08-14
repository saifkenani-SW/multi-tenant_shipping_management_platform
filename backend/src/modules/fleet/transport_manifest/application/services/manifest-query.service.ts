import { Inject, Injectable } from '@nestjs/common';
import { TransportManifestQueryRepository } from '../../infrastructure/repositories/transport-manifest-query.repository';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestNotFoundException } from '../../domain/exceptions/manifest-not-found.exception';
import { ManifestItemNotFoundException } from '../../domain/exceptions/manifest-item-not-found.exception';
import { ManifestQueryCriteriaBuilder } from '../builders/query/manifest-query-criteria.builder';
import { ManifestQueryDto } from '../dtos/requests/manifest-query.dto';
import { ManifestDetailsDto } from '../dtos/responses/manifest-details.dto';
import { ManifestItemDto } from '../dtos/responses/manifest-item.dto';
import { PaginatedManifestListDto } from '../dtos/responses/manifest-list.dto';
import { ManifestResponseMapper } from '../mappers/manifest-response.mapper';
import { PARCEL_LOOKUP } from '../../../contracts/parcel-lookup';
// Type-only: a type named in a decorated constructor must not be emitted as a
// value when isolatedModules and emitDecoratorMetadata are both on.
import type {
  ParcelLookup,
  ParcelSummary,
} from '../../../contracts/parcel-lookup';

/**
 * Read side of the manifest sub-domain.
 *
 * `tenantId` is optional throughout: a platform owner carries no tenant in the
 * request context and reads across every tenant, while any other caller is
 * always scoped to their own.
 */
@Injectable()
export class ManifestQueryService {
  constructor(
    private readonly queryRepository: TransportManifestQueryRepository,
    private readonly criteriaBuilder: ManifestQueryCriteriaBuilder,
    private readonly responseMapper: ManifestResponseMapper,
    @Inject(PARCEL_LOOKUP) private readonly parcelLookup: ParcelLookup,
  ) {}

  async findManifests(
    tenantId: string | undefined,
    query: ManifestQueryDto,
  ): Promise<PaginatedManifestListDto> {
    const criteria = this.criteriaBuilder.build(query, tenantId);
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
   * Labels for the parcels on a manifest, keyed by parcel id.
   *
   * A manifest item stores nothing but a parcel id, so without this the list
   * reads as a column of identifiers. Fetched through the Customer Shipment
   * facade in one call — Fleet still owns no parcel query of its own — and a
   * failure here costs the labels, not the manifest.
   */
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

  /** Returns the aggregate so callers can ask it to decide a transition. */
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
