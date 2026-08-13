import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';

import { CreateRoleDto } from './dtos/requests/create-role.dto';
import { RoleQueryDto } from './dtos/requests/role-query.dto';
import { SetRolePermissionsDto } from './dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from './dtos/requests/update-role.dto';
import { RoleDetailsDto } from './dtos/responses/role-details.dto';
import { PaginatedRoleListDto } from './dtos/responses/role-list.dto';
import { RoleService } from './services/role.service';
import { Roles } from '../../common/authorization';
import { RoleType } from './domain/enums/role.enum';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
  })
  async createRole(@Body() dto: CreateRoleDto): Promise<{ id: string }> {
    const id = await this.roleService.createRole(dto);
    return { id };
  }

  @Get()
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'List roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of roles',
    type: PaginatedRoleListDto,
  })
  async getRoles(@Query() query: RoleQueryDto): Promise<PaginatedRoleListDto> {
    return this.roleService.findRoles(query);
  }

  @Get(':id')
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get role details including its permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role details',
    type: RoleDetailsDto,
  })
  async getRoleDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<RoleDetailsDto> {
    return this.roleService.getRoleDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role updated successfully',
  })
  async updateRole(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateRoleDto,
  ): Promise<void> {
    await this.roleService.updateRole(params.id, dto);
  }

  @Put(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Replace the permissions granted to a role',
    description:
      'The submitted list becomes the full set of permissions for the role.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role permissions updated successfully',
  })
  async setRolePermissions(
    @Param() params: BaseUuidParamDto,
    @Body() dto: SetRolePermissionsDto,
  ): Promise<void> {
    await this.roleService.setRolePermissions(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Fails while the role is still assigned to employees.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role deleted successfully',
  })
  async deleteRole(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.roleService.deleteRole(params.id);
  }
}
