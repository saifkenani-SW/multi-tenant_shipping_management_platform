import { Inject, Injectable } from '@nestjs/common';
import type { ISubscriptionPlanCommandRepository } from '../interfaces/subscription-plan.command.repository.interface';
import { ISubscriptionPlanCommandService } from '../interfaces/subscription-plan.command.service.interface';
import { CreateSubscriptionPlanDto } from '../dtos/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dtos/requests/update-subscription-plan.dto';

import { CacheEvict } from '../../../core/cache/decorators/CacheEvict';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { SUBSCRIPTION_PLAN_CACHE_KEYS } from '../constants/subscription-plan.cache.constants';

@Injectable()
export class SubscriptionPlanCommandService implements ISubscriptionPlanCommandService {
  constructor(
    @Inject('ISubscriptionPlanCommandRepository')
    private readonly planRepository: ISubscriptionPlanCommandRepository,
    @Inject('ICacheProvider')
    public readonly cacheProvider: ICacheProvider,
  ) {}

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async createPlan(dto: CreateSubscriptionPlanDto): Promise<string> {
    const plan = await this.planRepository.create({
      name: dto.name,
      description: dto.description,
      max_branches: dto.max_branches ?? 5,
      max_warehouses: dto.max_warehouses ?? 2,
      max_employees: dto.max_employees ?? 20,
      max_vehicles: dto.max_vehicles ?? 10,
      max_zones: dto.max_zones ?? 3,
      max_monthly_shipments: dto.max_monthly_shipments,
      max_monthly_parcels: dto.max_monthly_parcels,
      price_monthly: dto.price_monthly ?? 0,
      price_yearly: dto.price_yearly,
      is_active: dto.is_active ?? true,
    });
    return plan.id;
  }

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => `${SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS}:${id}`,
  })
  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<void> {
    await this.planRepository.update(id, {
      name: dto.name,
      description: dto.description,
      max_branches: dto.max_branches,
      max_warehouses: dto.max_warehouses,
      max_employees: dto.max_employees,
      max_vehicles: dto.max_vehicles,
      max_zones: dto.max_zones,
      max_monthly_shipments: dto.max_monthly_shipments,
      max_monthly_parcels: dto.max_monthly_parcels,
      price_monthly: dto.price_monthly,
      price_yearly: dto.price_yearly,
    });
  }

  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => `${SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS}:${id}`,
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
    keyBuilder: (id: string) => `${SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS}:${id}`,
  })
  async activatePlan(id: string): Promise<void> {
    await this.planRepository.updateStatus(id, true);
  }
}
