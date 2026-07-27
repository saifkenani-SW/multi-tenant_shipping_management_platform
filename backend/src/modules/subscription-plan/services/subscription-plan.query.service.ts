import { Inject, Injectable } from '@nestjs/common';
import type { ISubscriptionPlanQueryRepository } from '../interfaces/subscription-plan.query.repository.interface';
import { ISubscriptionPlanQueryService } from '../interfaces/subscription-plan.query.service.interface';
import {
  PaginatedSubscriptionPlanListDto,
  SubscriptionPlanDetailsDto,
} from '../dtos/responses/subscription-plan-list.dto';
import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

@Injectable()
export class SubscriptionPlanQueryService implements ISubscriptionPlanQueryService {
  constructor(
    @Inject('ISubscriptionPlanQueryRepository')
    private readonly planQueryRepository: ISubscriptionPlanQueryRepository,
  ) {}

  async findPlans(
    page: number,
    limit: number,
    search?: string,
    searchType?: SubscriptionPlanSearchField,
  ): Promise<PaginatedSubscriptionPlanListDto> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.planQueryRepository.findMany(
      skip,
      limit,
      search,
      searchType,
    );

    const result = new PaginatedSubscriptionPlanListDto();
    result.data = items.map((plan: SubscriptionPlan) => this.mapToDto(plan));
    result.meta = {
      total,
      page,
      limit,
    };

    return result;
  }

  async getPlanDetails(id: string): Promise<SubscriptionPlanDetailsDto | null> {
    const plan = await this.planQueryRepository.findById(id);
    if (!plan) return null;

    return this.mapToDto(plan);
  }

  private mapToDto(plan: SubscriptionPlan): SubscriptionPlanDetailsDto {
    const dto = new SubscriptionPlanDetailsDto();
    dto.id = plan.id;
    dto.name = plan.name;
    dto.description = plan.description || undefined;
    dto.max_branches = plan.maxBranches;
    dto.max_warehouses = plan.maxWarehouses;
    dto.max_employees = plan.maxEmployees;
    dto.max_vehicles = plan.maxVehicles;
    dto.max_zones = plan.maxZones;
    dto.max_monthly_shipments = plan.maxMonthlyShipments ?? undefined;
    dto.max_monthly_parcels = plan.maxMonthlyParcels ?? undefined;
    dto.price_monthly = plan.priceMonthly;
    dto.price_yearly = plan.priceYearly ?? undefined;
    dto.is_active = plan.isActive;
    dto.created_at = plan.createdAt;
    dto.updated_at = plan.updatedAt;
    return dto;
  }
}
