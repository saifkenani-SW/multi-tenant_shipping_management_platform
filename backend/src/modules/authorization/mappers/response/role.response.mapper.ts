import { Injectable } from '@nestjs/common';

<<<<<<<< HEAD:backend/src/modules/authorization/role/mappers/response/role.response.mapper.ts
import { Pagination, PaginationMeta } from '../../../../../common/pagination';
import { PermissionResponseMapper } from '../../../permission/mappers/response/permission.response.mapper';
========
import { Pagination, PaginationMeta } from '../../../../common/pagination';
>>>>>>>> bd5bcedf760812c3f4fae1fb4b0cc179fb305a8c:backend/src/modules/authorization/mappers/response/role.response.mapper.ts
import { Role } from '../../domain/role.entity';
import { RoleDetailsDto } from '../../dtos/responses/role-details.dto';
import {
  PaginatedRoleListDto,
  RoleListDto,
} from '../../dtos/responses/role-list.dto';
import { PermissionResponseMapper } from './permission.response.mapper';

@Injectable()
export class RoleResponseMapper {
  constructor(
    private readonly permissionResponseMapper: PermissionResponseMapper,
  ) {}

  toListDto(role: Role): RoleListDto {
    const dto = new RoleListDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.description = role.description;
    dto.isActive = role.isActive;
    dto.permissionCount = role.permissions.length;
    dto.createdAt = role.createdAt;
    return dto;
  }

  toDetailsDto(role: Role): RoleDetailsDto {
    const dto = new RoleDetailsDto();
    dto.id = role.id;
    dto.tenantId = role.tenantId;
    dto.name = role.name;
    dto.description = role.description;
    dto.isActive = role.isActive;
    dto.createdAt = role.createdAt;
    dto.permissions = role.permissions.map((permission) =>
      this.permissionResponseMapper.toListDto(permission),
    );
    return dto;
  }

  toPaginatedListDto(
    roles: Role[],
    total: number,
    pagination: Pagination,
  ): PaginatedRoleListDto {
    const dto = new PaginatedRoleListDto();
    dto.data = roles.map((role) => this.toListDto(role));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
