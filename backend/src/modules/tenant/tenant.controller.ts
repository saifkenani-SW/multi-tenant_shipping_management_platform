import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ITenantCommandService } from './interfaces/tenant.command.service.interface';
import { CreateTenantDto } from './dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from './dtos/requests/update-tenant.dto';
import type { ITenantQueryService } from './interfaces/tenant.query.service.interface';
import { PaginatedTenantListDto } from './dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from './dtos/responses/tenant-details.dto';
import type { JwtPayload } from '../auth/types/auth.types';
import { UserLoginType } from '../auth/types/auth.types';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { TenantQueryDto } from './dtos/requests/tenant-query.dto';
import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('tenants')
export class TenantController {
  constructor(
    @Inject('ITenantCommandService')
    private readonly tenantCommandService: ITenantCommandService,
    @Inject('ITenantQueryService')
    private readonly tenantQueryService: ITenantQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a new tenant (Platform Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant created successfully',
    type: String,
  })
  async createTenant(@Body() dto: CreateTenantDto): Promise<{ id: string }> {
    const id = await this.tenantCommandService.createTenant(dto);
    return { id };
  }

  @Get()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all tenants (Platform Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tenants',
    type: PaginatedTenantListDto,
  })
  async getTenants(
    @Query() query: TenantQueryDto,
  ): Promise<PaginatedTenantListDto> {
    return this.tenantQueryService.findTenants(
      query.page,
      query.limit,
      query.search,
      query.searchType,
    );
  }

  @Get(':id')
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant details',
    type: TenantDetailsDto,
  })
  async getTenantDetails(
    @Param() params: BaseUuidParamDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TenantDetailsDto> {
    const id = params.id;
    if (user.type === UserLoginType.EMPLOYEE && user.tenantId !== id) {
      throw new ForbiddenException(
        'Tenant isolation violation: Unauthorized access',
      );
    }
    const details = await this.tenantQueryService.getTenantDetails(id);
    if (!details) throw new NotFoundException('Tenant not found');
    return details;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant updated successfully',
  })
  async updateTenant(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    if (user.type === UserLoginType.EMPLOYEE && user.tenantId !== id) {
      throw new ForbiddenException(
        'Tenant isolation violation: Unauthorized access',
      );
    }
    await this.tenantCommandService.updateTenant(id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Suspend a tenant (Platform Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant suspended successfully',
  })
  async suspendTenant(
    @Param() params: BaseUuidParamDto,
    @Body('reason') reason?: string,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.suspendTenant(id, reason);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Activate a suspended tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant activated successfully',
  })
  async activateTenant(@Param() params: BaseUuidParamDto): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.activateTenant(id);
  }
}
