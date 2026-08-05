import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { UserLoginType } from '../auth/types/auth.types';

import { PermissionQueryDto } from './dtos/requests/permission-query.dto';
import { PermissionDetailsDto } from './dtos/responses/permission-details.dto';
import { PaginatedPermissionListDto } from './dtos/responses/permission-list.dto';
import { PermissionService } from './services/permission.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
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
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
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
