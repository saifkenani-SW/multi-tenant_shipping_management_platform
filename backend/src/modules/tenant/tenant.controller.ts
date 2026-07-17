import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ITenantCommandService } from './interfaces/tenant.command.service.interface';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import type { ITenantQueryService } from './interfaces/tenant.query.service.interface';
import { PaginatedTenantListDto } from './dtos/tenant-list.dto';
import { TenantDetailsDto } from './dtos/tenant-details.dto';
import type { JwtPayload } from '../auth/types/auth.types';
import { UserLoginType } from '../auth/types/auth.types';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { TenantQueryDto } from './dtos/tenant-query.dto';

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
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TenantDetailsDto> {
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
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
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
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<void> {
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
  async activateTenant(@Param('id') id: string): Promise<void> {
    await this.tenantCommandService.activateTenant(id);
  }
}
