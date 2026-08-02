import { Injectable } from '@nestjs/common';

import { Pagination, PaginationMeta } from '../../../../../common/pagination';
import { Permission } from '../../domain/permission.entity';
import { PermissionDetailsDto } from '../../dtos/responses/permission-details.dto';
import {
  PaginatedPermissionListDto,
  PermissionListDto,
} from '../../dtos/responses/permission-list.dto';

@Injectable()
export class PermissionResponseMapper {
  toListDto(permission: Permission): PermissionListDto {
    const dto = new PermissionListDto();
    dto.id = permission.id;
    dto.name = permission.name;
    dto.resource = permission.resource;
    dto.action = permission.action;
    return dto;
  }

  toDetailsDto(permission: Permission): PermissionDetailsDto {
    const dto = new PermissionDetailsDto();
    dto.id = permission.id;
    dto.name = permission.name;
    dto.resource = permission.resource;
    dto.action = permission.action;
    dto.description = permission.description;
    return dto;
  }

  toPaginatedListDto(
    permissions: Permission[],
    total: number,
    pagination: Pagination,
  ): PaginatedPermissionListDto {
    const dto = new PaginatedPermissionListDto();
    dto.data = permissions.map((permission) => this.toListDto(permission));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
