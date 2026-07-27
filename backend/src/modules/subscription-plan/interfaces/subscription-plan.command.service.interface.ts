import { CreateSubscriptionPlanDto } from '../dtos/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dtos/requests/update-subscription-plan.dto';

export interface ISubscriptionPlanCommandService {
  createPlan(dto: CreateSubscriptionPlanDto): Promise<string>;
  updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<void>;
  activatePlan(id: string): Promise<void>;
  deactivatePlan(id: string): Promise<void>;
}
