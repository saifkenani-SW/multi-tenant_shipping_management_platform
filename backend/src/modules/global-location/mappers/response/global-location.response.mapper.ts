import { Injectable } from '@nestjs/common';

import { Pagination, PaginationMeta } from '../../../../common/pagination';
import { GlobalLocation } from '../../domain/global-location.entity';
import { GlobalLocationDetailsDto } from '../../dtos/responses/global-location-details.dto';
import {
  GlobalLocationListDto,
  PaginatedGlobalLocationListDto,
} from '../../dtos/responses/global-location-list.dto';

@Injectable()
export class GlobalLocationResponseMapper {
  toListDto(location: GlobalLocation): GlobalLocationListDto {
    const dto = new GlobalLocationListDto();
    dto.id = location.id;
    dto.name = location.name;
    dto.type = location.type;
    dto.parentId = location.parentId;
    return dto;
  }

  toDetailsDto(
    location: GlobalLocation,
    ancestors: readonly GlobalLocation[] = [],
  ): GlobalLocationDetailsDto {
    const dto = new GlobalLocationDetailsDto();
    dto.id = location.id;
    dto.name = location.name;
    dto.type = location.type;
    dto.parentId = location.parentId;
    dto.longitude = location.point?.longitude ?? null;
    dto.latitude = location.point?.latitude ?? null;
    dto.ancestors = ancestors.map((ancestor) => this.toListDto(ancestor));
    return dto;
  }

  toPaginatedListDto(
    locations: GlobalLocation[],
    total: number,
    pagination: Pagination,
  ): PaginatedGlobalLocationListDto {
    const dto = new PaginatedGlobalLocationListDto();
    dto.data = locations.map((location) => this.toListDto(location));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
