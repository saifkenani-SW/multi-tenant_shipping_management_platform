import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import type { ITenantCommandService } from '../../application/interfaces/tenant.command.service.interface';
import { CreateTenantDto } from '../../application/dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../../application/dtos/requests/update-tenant.dto';
import type { ITenantQueryService } from '../../application/interfaces/tenant.query.service.interface';
import { PaginatedTenantListDto } from '../../application/dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../../application/dtos/responses/tenant-details.dto';
import type { JwtPayload } from '../../../auth/types/auth.types';
import { UserLoginType } from '../../../auth/types/auth.types';
import { RequireTypes } from '../../../auth/authorization/decorators/require-types.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { UserTypeGuard } from '../../../auth/authorization/guards/user-type.guard';
import { TenantQueryDto } from '../../application/dtos/requests/tenant-query.dto';
import { AssignSubscriptionDto } from '../../application/dtos/requests/assign-subscription.dto';
import { RenewSubscriptionDto } from '../../application/dtos/requests/renew-subscription.dto';
import {
  ReasonDto,
  SuspendSubscriptionDto,
  CancelSubscriptionDto,
} from '../../application/dtos/requests/subscription-action.dto';
import { TenantSubscriptionDto } from '../../application/dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../../application/dtos/responses/tenant-subscription-history.dto';
import { BaseUuidParamDto } from '../../../../core/dtos/base-uuid-param.dto';
import {
  TENANT_COMMAND_SERVICE,
  TENANT_QUERY_SERVICE,
} from '../../tokens/tenant-service.tokens';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('tenants')
export class TenantController {
  constructor(
    @Inject(TENANT_COMMAND_SERVICE)
    private readonly tenantCommandService: ITenantCommandService,
    @Inject(TENANT_QUERY_SERVICE)
    private readonly tenantQueryService: ITenantQueryService,
  ) {}

  @Post()
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
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
    return this.tenantQueryService.getTenantDetails(id);
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
  ): Promise<void> {
    const id = params.id;
    await this.tenantCommandService.updateTenant(id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
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
    return this.tenantQueryService.getTenantSubscription(id);
  }

  @Get(':id/subscriptions/history')
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
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
    return this.tenantQueryService.getTenantSubscriptionHistory(id);
  }

  @Post(':id/subscriptions/assign')
  @HttpCode(HttpStatus.OK)
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
  //  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
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
}
