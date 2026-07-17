import { SubscriptionPlan } from '../aggregates/subscription-plan.aggregate';

export interface ISubscriptionPlanRepository {
  save(plan: SubscriptionPlan): Promise<void>;
  findById(id: string): Promise<SubscriptionPlan | null>;
}
