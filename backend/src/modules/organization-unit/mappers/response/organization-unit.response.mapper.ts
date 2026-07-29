import { Injectable } from '@nestjs/common';

import { Pagination, PaginationMeta } from '../../../../common/pagination';
import { OrganizationUnit } from '../../domain/organization-unit.entity';
import { OrganizationUnitDetailsDto } from '../../dtos/responses/organization-unit-details.dto';
import {
  OrganizationUnitListDto,
  PaginatedOrganizationUnitListDto,
} from '../../dtos/responses/organization-unit-list.dto';

@Injectable()
export class OrganizationUnitResponseMapper {
  toListDto(unit: OrganizationUnit): OrganizationUnitListDto {
    const dto = new OrganizationUnitListDto();
    dto.id = unit.id;
    dto.name = unit.name;
    dto.orgType = unit.orgType;
    dto.parentId = unit.parentId;
    dto.isActive = unit.isActive;
    return dto;
  }

  toDetailsDto(
    unit: OrganizationUnit,
    ancestors: readonly OrganizationUnit[] = [],
  ): OrganizationUnitDetailsDto {
    const dto = new OrganizationUnitDetailsDto();
    dto.id = unit.id;
    dto.tenantId = unit.tenantId;
    dto.name = unit.name;
    dto.orgType = unit.orgType;
    dto.parentId = unit.parentId;
    dto.zoneId = unit.zoneId;
    dto.addressLine = unit.addressLine;
    dto.isActive = unit.isActive;
    dto.longitude = unit.point?.longitude ?? null;
    dto.latitude = unit.point?.latitude ?? null;
    dto.coverageLocationIds = [...unit.coverageLocationIds];
    dto.createdAt = unit.createdAt;
    dto.updatedAt = unit.updatedAt;
    dto.ancestors = ancestors.map((ancestor) => this.toListDto(ancestor));
    return dto;
  }

  toPaginatedListDto(
    units: OrganizationUnit[],
    total: number,
    pagination: Pagination,
  ): PaginatedOrganizationUnitListDto {
    const dto = new PaginatedOrganizationUnitListDto();
    dto.data = units.map((unit) => this.toListDto(unit));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
