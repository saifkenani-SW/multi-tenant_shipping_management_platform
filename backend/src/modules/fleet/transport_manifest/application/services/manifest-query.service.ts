import { Injectable } from '@nestjs/common';
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

    return this.responseMapper.toDetailsDto(manifest, items);
  }

  async getManifestItems(
    tenantId: string | undefined,
    manifestId: string,
  ): Promise<ManifestItemDto[]> {
    await this.findManifestOrThrow(tenantId, manifestId);
    const items = await this.queryRepository.findItems(manifestId);

    return items.map((item) => this.responseMapper.toItemDto(item));
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
