import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSubscriptionPlanUseCase } from '../../application/use-cases/create-subscription-plan.use-case';
import { SubscribeTenantUseCase } from '../../application/use-cases/subscribe-tenant.use-case';
import { CreateSubscriptionPlanCommand } from '../../application/dtos/create-subscription-plan.command';
import { SubscribeTenantCommand } from '../../application/dtos/subscribe-tenant.command';
import type { ISubscriptionPlanQueryService } from '../../application/query-services/subscription-plan.query-service.interface';
import type { ITenantSubscriptionQueryService } from '../../application/query-services/tenant-subscription.query-service.interface';
import { SubscriptionPlanDto } from '../../application/dtos/subscription-plan.dto';
import {
  SubscriptionHistoryDto,
  TenantSubscriptionDto,
} from '../../application/dtos/tenant-subscription.dto';

@ApiTags('Subscriptions')
@Controller()
export class SubscriptionController {
  constructor(
    private readonly createPlanUseCase: CreateSubscriptionPlanUseCase,
    private readonly subscribeTenantUseCase: SubscribeTenantUseCase,
    @Inject('ISubscriptionPlanQueryService')
    private readonly planQueryService: ISubscriptionPlanQueryService,
    @Inject('ITenantSubscriptionQueryService')
    private readonly subscriptionQueryService: ITenantSubscriptionQueryService,
  ) {}

  @Post('subscription-plans')
  @ApiOperation({
    summary: 'Create a new subscription plan (Platform Owner only)',
  })
  @ApiHeader({
    name: 'x-role',
    description: 'Simulated auth role (e.g., PLATFORM_OWNER)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Plan created successfully',
  })
  async createPlan(
    @Body() command: CreateSubscriptionPlanCommand,
    @Headers('x-role') role: string,
  ): Promise<{ id: string }> {
    if (role !== 'PLATFORM_OWNER')
      throw new UnauthorizedException('Unauthorized');
    const id = await this.createPlanUseCase.execute(command);
    return { id };
  }

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List all active subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of plans',
    type: [SubscriptionPlanDto],
  })
  async getPlans(): Promise<SubscriptionPlanDto[]> {
    return this.planQueryService.findActivePlans();
  }

  @Post('tenants/:tenantId/subscriptions')
  @ApiOperation({ summary: 'Subscribe tenant to a plan' })
  @ApiHeader({ name: 'x-role', description: 'Simulated auth role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscribed successfully',
  })
  async subscribeTenant(
    @Param('tenantId') tenantId: string,
    @Body() command: SubscribeTenantCommand,
    @Headers('x-role') role: string,
  ): Promise<{ id: string }> {
    if (role !== 'PLATFORM_OWNER')
      throw new UnauthorizedException('Unauthorized');

    // Command URL path matching
    if (command.tenantId !== tenantId) {
      throw new BadRequestException('Tenant ID in path does not match body');
    }

    const id = await this.subscribeTenantUseCase.execute(command);
    return { id };
  }

  @Get('tenants/:tenantId/subscriptions/current')
  @ApiOperation({ summary: 'Get current active subscription for a tenant' })
  @ApiHeader({
    name: 'x-tenant-id',
    description: 'Simulated auth tenant context',
  })
  @ApiHeader({ name: 'x-role', description: 'Simulated auth role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current subscription',
    type: TenantSubscriptionDto,
  })
  async getCurrentSubscription(
    @Param('tenantId') tenantId: string,
    @Headers('x-tenant-id') tenantIdContext: string,
    @Headers('x-role') role: string,
  ): Promise<TenantSubscriptionDto> {
    if (role !== 'PLATFORM_OWNER' && tenantId !== tenantIdContext) {
      throw new ForbiddenException(
        'Tenant isolation violation: Unauthorized access',
      );
    }
    const sub =
      await this.subscriptionQueryService.getCurrentSubscription(tenantId);
    if (!sub) throw new NotFoundException('Active subscription not found');
    return sub;
  }

  @Get('tenants/:tenantId/subscriptions/history')
  @ApiOperation({ summary: 'Get subscription history for a tenant' })
  @ApiHeader({
    name: 'x-tenant-id',
    description: 'Simulated auth tenant context',
  })
  @ApiHeader({ name: 'x-role', description: 'Simulated auth role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription history',
    type: [SubscriptionHistoryDto],
  })
  async getSubscriptionHistory(
    @Param('tenantId') tenantId: string,
    @Headers('x-tenant-id') tenantIdContext: string,
    @Headers('x-role') role: string,
  ): Promise<SubscriptionHistoryDto[]> {
    if (role !== 'PLATFORM_OWNER' && tenantId !== tenantIdContext) {
      throw new ForbiddenException(
        'Tenant isolation violation: Unauthorized access',
      );
    }
    return this.subscriptionQueryService.getSubscriptionHistory(tenantId);
  }
}
