import {
  SUBSCRIPTION_PLAN_COMMAND_SERVICE,
  SUBSCRIPTION_PLAN_QUERY_SERVICE,
} from './tokens/subscription-plan-service.tokens';
import {
  Body,
  Controller,
  Get,
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
import type { ISubscriptionPlanCommandService } from './interfaces/subscription-plan.command.service.interface';
import type { ISubscriptionPlanQueryService } from './interfaces/subscription-plan.query.service.interface';
import { CreateSubscriptionPlanDto } from './dtos/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dtos/requests/update-subscription-plan.dto';
import { SubscriptionPlanQueryDto } from './dtos/requests/subscription-plan-query.dto';
import {
  PaginatedSubscriptionPlanListDto,
  SubscriptionPlanDetailsDto,
} from './dtos/responses/subscription-plan-list.dto';
import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserLoginType } from '../auth/types/auth.types';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@RequireTypes(UserLoginType.PLATFORM_OWNER)
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_COMMAND_SERVICE)
    private readonly commandService: ISubscriptionPlanCommandService,
    @Inject(SUBSCRIPTION_PLAN_QUERY_SERVICE)
    private readonly queryService: ISubscriptionPlanQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The subscription plan has been successfully created',
  })
  async createPlan(
    @Body() dto: CreateSubscriptionPlanDto,
  ): Promise<{ id: string }> {
    const id = await this.commandService.createPlan(dto);
    return { id };
  }

  @Get()
  @ApiOperation({ summary: 'List all subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of subscription plans',
    type: PaginatedSubscriptionPlanListDto,
  })
  async getPlans(
    @Query() query: SubscriptionPlanQueryDto,
  ): Promise<PaginatedSubscriptionPlanListDto> {
    return await this.queryService.findPlans(
      query.page,
      query.limit,
      query.search,
      query.searchType,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the subscription plan details',
    type: SubscriptionPlanDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription plan not found',
  })
  async getPlanDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<SubscriptionPlanDetailsDto> {
    const plan = await this.queryService.getPlanDetails(params.id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The subscription plan has been successfully updated',
  })
  async updatePlan(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateSubscriptionPlanDto,
  ): Promise<void> {
    await this.commandService.updatePlan(params.id, dto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The subscription plan has been successfully deactivated',
  })
  async deactivatePlan(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.deactivatePlan(params.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The subscription plan has been successfully activated',
  })
  async activatePlan(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.activatePlan(params.id);
  }
}
