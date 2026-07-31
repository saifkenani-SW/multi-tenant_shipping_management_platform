import { SUBSCRIPTION_PLAN_COMMAND_REPOSITORY } from '../tokens/subscription-plan-repository.tokens';
import { Inject, Injectable } from '@nestjs/common';
import type { ISubscriptionPlanCommandRepository } from '../interfaces/subscription-plan.command.repository.interface';
import { ISubscriptionPlanCommandService } from '../interfaces/subscription-plan.command.service.interface';
import { CreateSubscriptionPlanDto } from '../dtos/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dtos/requests/update-subscription-plan.dto';

import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { SUBSCRIPTION_PLAN_CACHE_KEYS } from '../constants/subscription-plan.cache.constants';

@Injectable()
export class SubscriptionPlanCommandService implements ISubscriptionPlanCommandService {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_COMMAND_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanCommandRepository,
  ) {}

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async createPlan(dto: CreateSubscriptionPlanDto): Promise<string> {
    const plan = await this.planRepository.create({
      name: dto.name,
      description: dto.description,
      max_branches: dto.maxBranches ?? 5,
      max_warehouses: dto.maxWarehouses ?? 2,
      max_employees: dto.maxEmployees ?? 20,
      max_vehicles: dto.maxVehicles ?? 10,
      max_zones: dto.maxZones ?? 3,
      max_monthly_shipments: dto.maxMonthlyShipments,
      max_monthly_parcels: dto.maxMonthlyParcels,
      price_monthly: dto.priceMonthly ?? 0,
      price_yearly: dto.priceYearly,
      is_active: dto.isActive ?? true,
    });
    return plan.id;
  }

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS, id],
  })
  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<void> {
    await this.planRepository.update(id, {
      name: dto.name,
      description: dto.description,
      max_branches: dto.maxBranches,
      max_warehouses: dto.maxWarehouses,
      max_employees: dto.maxEmployees,
      max_vehicles: dto.maxVehicles,
      max_zones: dto.maxZones,
      max_monthly_shipments: dto.maxMonthlyShipments,
      max_monthly_parcels: dto.maxMonthlyParcels,
      price_monthly: dto.priceMonthly,
      price_yearly: dto.priceYearly,
    });
  }

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS, id],
  })
  async deactivatePlan(id: string): Promise<void> {
    await this.planRepository.updateStatus(id, false);
  }

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS, id],
  })
  async activatePlan(id: string): Promise<void> {
    await this.planRepository.updateStatus(id, true);
  }
}
