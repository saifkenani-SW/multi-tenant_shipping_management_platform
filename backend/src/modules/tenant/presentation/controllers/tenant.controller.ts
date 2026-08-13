import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantCommandService } from '../../application/services/tenant.command.service';
import { CreateTenantDto } from '../../application/dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../../application/dtos/requests/update-tenant.dto';
import { TenantQueryService } from '../../application/services/tenant.query.service';
import { PaginatedTenantListDto } from '../../application/dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../../application/dtos/responses/tenant-details.dto';
import { TenantSettingsDto } from '../../application/dtos/responses/tenant-settings.dto';
import { UpdateTenantDeliverySettingsDto } from '../../application/dtos/requests/update-tenant-delivery-settings.dto';
import { UpdateTenantOperationalSettingsDto } from '../../application/dtos/requests/update-tenant-operational-settings.dto';
import { UpdateTenantPricingSettingsDto } from '../../application/dtos/requests/update-tenant-pricing-settings.dto';
import type { JwtPayload } from '../../../auth/types/auth.types';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { TenantQueryDto } from '../../application/dtos/requests/tenant-query.dto';
import { AssignSubscriptionDto } from '../../application/dtos/requests/assign-subscription.dto';
import {
  CancelSubscriptionDto,
  ReasonDto,
  SuspendSubscriptionDto,
} from '../../application/dtos/requests/subscription-action.dto';
import { TenantSubscriptionDto } from '../../application/dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../../application/dtos/responses/tenant-subscription-history.dto';
import { BaseUuidParamDto } from '../../../../core/dtos/base-uuid-param.dto';
import { Roles } from 'src/common/authorization';
import { RoleType } from 'src/modules/authorization';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantCommandService: TenantCommandService,
    private readonly tenantQueryService: TenantQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.PLATFORM_OWNER)
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
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'List all tenants (Platform Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tenants',
    type: PaginatedTenantListDto,
  })
  async getTenants(
    @Query() query: TenantQueryDto,
  ): Promise<PaginatedTenantListDto> {
    return this.tenantQueryService.findTenants(query);
  }

  @Get(':id')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant details',
    type: TenantDetailsDto,
  })
  async getTenantDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<TenantDetailsDto> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    return this.tenantQueryService.getTenantDetails(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant updated successfully',
  })
  async updateTenant(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateTenantDto,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.updateTenant(id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
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
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Activate a suspended tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant activated successfully',
  })
  async activateTenant(@Param() params: BaseUuidParamDto): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.activateTenant(id);
  }

  @Get(':id/subscriptions/active')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get active subscription for a tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active subscription details',
    type: TenantSubscriptionDto,
  })
  async getTenantSubscription(
    @Param() params: BaseUuidParamDto,
  ): Promise<TenantSubscriptionDto | null> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    return this.tenantQueryService.getTenantSubscription(id);
  }

  @Get(':id/subscriptions/history')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get subscription history for a tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription history list',
    type: [TenantSubscriptionHistoryDto],
  })
  async getTenantSubscriptionHistory(
    @Param() params: BaseUuidParamDto,
  ): Promise<TenantSubscriptionHistoryDto[]> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    return this.tenantQueryService.getTenantSubscriptionHistory(id);
  }

  @Post(':id/subscriptions/assign')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Assign a subscription to a tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription assigned successfully',
  })
  async assignSubscription(
    @Param() params: BaseUuidParamDto,
    @Body() dto: AssignSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.assignSubscription(id, dto, user.sub);
  }

  @Post(':id/subscriptions/renew')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Renew or upgrade a subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription renewed successfully',
  })
  /*  async renewSubscription(
    @Param() params: BaseUuidParamDto,
    @Body() dto: RenewSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.renewSubscription(id, dto, user.sub);
  }*/
  @Post(':id/subscriptions/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Suspend an active subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription suspended successfully',
  })
  async suspendSubscription(
    @Param() params: BaseUuidParamDto,
    @Body() dto: SuspendSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.suspendSubscription(id, dto, user.sub);
  }

  @Post(':id/subscriptions/resume')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Resume a suspended subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription resumed successfully',
  })
  async resumeSubscription(
    @Param() params: BaseUuidParamDto,
    @Body() dto: ReasonDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.resumeSubscription(id, dto, user.sub);
  }

  @Post(':id/subscriptions/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
  })
  async cancelSubscription(
    @Param() params: BaseUuidParamDto,
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.cancelSubscription(id, dto, user.sub);
  }

  @Patch(':id/settings/delivery')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant delivery settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery settings updated successfully',
  })
  async updateDeliverySettings(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateTenantDeliverySettingsDto,
  ): Promise<void> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    await this.tenantCommandService.updateDeliverySettings(id, dto);
  }

  @Patch(':id/settings/operational')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant operational settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operational settings updated successfully',
  })
  async updateOperationalSettings(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateTenantOperationalSettingsDto,
  ): Promise<void> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    await this.tenantCommandService.updateOperationalSettings(id, dto);
  }

  @Patch(':id/settings/pricing')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant pricing settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing settings updated successfully',
  })
  async updatePricingSettings(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateTenantPricingSettingsDto,
  ): Promise<void> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    await this.tenantCommandService.updatePricingSettings(id, dto);
  }

  @Get(':id/settings')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get all settings for a tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant settings',
    type: TenantSettingsDto,
  })
  async getTenantSettings(
    @Param() params: BaseUuidParamDto,
  ): Promise<TenantSettingsDto> {
    const id = params.id;
    if (
      this.requestContext.getPrincipal().tenantId &&
      id !== this.requestContext.getPrincipal().tenantId
    ) {
      throw new ForbiddenException('You do not have permission to access');
    }
    return this.tenantQueryService.getTenantSettings(id);
  }
}
