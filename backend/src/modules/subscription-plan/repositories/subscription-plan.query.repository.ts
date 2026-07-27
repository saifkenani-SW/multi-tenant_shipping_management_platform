import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionPlanQueryRepository } from '../interfaces/subscription-plan.query.repository.interface';
import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import {
  SUBSCRIPTION_PLAN_CACHE_KEYS,
  SUBSCRIPTION_PLAN_CACHE_TTL,
} from '../constants/subscription-plan.cache.constants';
import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';
import { Kysely } from 'kysely';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

@Injectable()
export class SubscriptionPlanQueryRepository implements ISubscriptionPlanQueryRepository {
  constructor(@Inject('KYSELY_INSTANCE') public readonly kysely: Kysely<DB>) {}

  @Cacheable({
    ttl: SUBSCRIPTION_PLAN_CACHE_TTL.LIST,
    keyBuilder: (
      skip: number,
      take: number,
      search?: string,
      searchType?: SubscriptionPlanSearchField,
    ) => [
      SUBSCRIPTION_PLAN_CACHE_KEYS.LIST,
      skip,
      take,
      searchType ?? 'any',
      search ?? 'all',
    ],
  })
  async findMany(
    skip: number,
    take: number,
    search?: string,
    searchType?: SubscriptionPlanSearchField,
  ): Promise<[SubscriptionPlan[], number]> {
    let query = this.kysely
      .selectFrom('subscription_plan')
      .select([
        'id',
        'name',
        'description',
        'max_branches',
        'max_warehouses',
        'max_employees',
        'max_vehicles',
        'max_zones',
        'max_monthly_shipments',
        'max_monthly_parcels',
        'price_monthly',
        'price_yearly',
        'is_active',
        'created_at',
        'updated_at',
      ]);

    let countQuery = this.kysely
      .selectFrom('subscription_plan')
      .select((eb) => eb.fn.count('id').as('count'));

    if (search) {
      const field =
        searchType === SubscriptionPlanSearchField.NAME ? 'name' : 'name';
      query = query.where(field, 'ilike', `%${search}%`);
      countQuery = countQuery.where(field, 'ilike', `%${search}%`);
    }

    query = query.orderBy('created_at', 'desc').offset(skip).limit(take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const mappedItems = items.map(
      (plan) =>
        new SubscriptionPlan(
          plan.id,
          plan.name,
          plan.description,
          plan.max_branches,
          plan.max_warehouses,
          plan.max_employees,
          plan.max_vehicles,
          plan.max_zones,
          plan.max_monthly_shipments,
          plan.max_monthly_parcels,
          Number(plan.price_monthly),
          plan.price_yearly !== null ? Number(plan.price_yearly) : null,
          plan.is_active,
          plan.created_at,
          plan.updated_at,
        ),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: SUBSCRIPTION_PLAN_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [SUBSCRIPTION_PLAN_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<SubscriptionPlan | null> {
    const plan = await this.kysely
      .selectFrom('subscription_plan')
      .select([
        'id',
        'name',
        'description',
        'max_branches',
        'max_warehouses',
        'max_employees',
        'max_vehicles',
        'max_zones',
        'max_monthly_shipments',
        'max_monthly_parcels',
        'price_monthly',
        'price_yearly',
        'is_active',
        'created_at',
        'updated_at',
      ])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!plan) return null;

    return new SubscriptionPlan(
      plan.id,
      plan.name,
      plan.description,
      plan.max_branches,
      plan.max_warehouses,
      plan.max_employees,
      plan.max_vehicles,
      plan.max_zones,
      plan.max_monthly_shipments,
      plan.max_monthly_parcels,
      Number(plan.price_monthly),
      plan.price_yearly !== null ? Number(plan.price_yearly) : null,
      plan.is_active,
      plan.created_at,
      plan.updated_at,
    );
  }
}
