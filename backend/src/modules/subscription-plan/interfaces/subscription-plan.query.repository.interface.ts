import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

export interface ISubscriptionPlanQueryRepository {
  findMany(
    skip: number,
    take: number,
    search?: string,
    searchType?: SubscriptionPlanSearchField,
  ): Promise<[SubscriptionPlan[], number]>;
  findById(id: string): Promise<SubscriptionPlan | null>;
}
