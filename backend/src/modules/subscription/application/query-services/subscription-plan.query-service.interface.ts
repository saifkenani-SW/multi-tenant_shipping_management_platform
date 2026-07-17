import { SubscriptionPlanDto } from '../dtos/subscription-plan.dto';

export interface ISubscriptionPlanQueryService {
  findAllPlans(): Promise<SubscriptionPlanDto[]>;
  findActivePlans(): Promise<SubscriptionPlanDto[]>;
}
