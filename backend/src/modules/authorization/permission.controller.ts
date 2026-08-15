import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { PermissionQueryDto } from './dtos/requests/permission-query.dto';
import { PermissionDetailsDto } from './dtos/responses/permission-details.dto';
import { PaginatedPermissionListDto } from './dtos/responses/permission-list.dto';
import { PermissionService } from './services/permission.service';
import { Roles } from '../../common/authorization';
import { RoleType } from './domain/enums/role.enum';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'List the permission catalog' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of permissions',
    type: PaginatedPermissionListDto,
  })
  async getPermissions(
    @Query() query: PermissionQueryDto,
  ): Promise<PaginatedPermissionListDto> {
    return this.permissionService.findPermissions(query);
  }

  @Get(':id')
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get permission details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission details',
    type: PermissionDetailsDto,
  })
  async getPermissionDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<PermissionDetailsDto> {
    return this.permissionService.getPermissionDetails(params.id);
  }
}
