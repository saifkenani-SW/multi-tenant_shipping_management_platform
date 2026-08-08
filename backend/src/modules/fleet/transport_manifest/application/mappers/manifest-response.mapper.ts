import { Injectable } from '@nestjs/common';
import { Pagination, PaginationMeta } from '../../../../../common/pagination';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestDetailsDto } from '../dtos/responses/manifest-details.dto';
import { ManifestItemDto } from '../dtos/responses/manifest-item.dto';
import {
  ManifestListDto,
  PaginatedManifestListDto,
} from '../dtos/responses/manifest-list.dto';

@Injectable()
export class ManifestResponseMapper {
  toItemDto(item: ManifestItem): ManifestItemDto {
    const dto = new ManifestItemDto();
    dto.id = item.id;
    dto.manifestId = item.manifestId;
    dto.parcelId = item.parcelId;
    dto.status = item.status;
    dto.loadedAt = item.loadedAt;
    dto.unloadedAt = item.unloadedAt;
    return dto;
  }

  toListDto(manifest: TransportManifest, itemCount: number): ManifestListDto {
    const dto = new ManifestListDto();
    dto.id = manifest.id;
    dto.tripId = manifest.tripId;
    dto.originOrgUnitId = manifest.originOrgUnitId;
    dto.destinationOrgUnitId = manifest.destinationOrgUnitId;
    dto.status = manifest.status;
    dto.itemCount = itemCount;
    dto.createdAt = manifest.createdAt;
    return dto;
  }

  toDetailsDto(
    manifest: TransportManifest,
    items: ManifestItem[],
  ): ManifestDetailsDto {
    const dto = new ManifestDetailsDto();
    dto.id = manifest.id;
    dto.tenantId = manifest.tenantId;
    dto.tripId = manifest.tripId;
    dto.originOrgUnitId = manifest.originOrgUnitId;
    dto.destinationOrgUnitId = manifest.destinationOrgUnitId;
    dto.status = manifest.status;
    dto.createdAt = manifest.createdAt;
    dto.updatedAt = manifest.updatedAt;
    dto.items = items.map((item) => this.toItemDto(item));
    return dto;
  }

  toPaginatedListDto(
    records: Array<{ manifest: TransportManifest; itemCount: number }>,
    total: number,
    pagination: Pagination,
  ): PaginatedManifestListDto {
    const dto = new PaginatedManifestListDto();
    dto.data = records.map((record) =>
      this.toListDto(record.manifest, record.itemCount),
    );
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
