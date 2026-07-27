import {
  PaginatedSubscriptionPlanListDto,
  SubscriptionPlanDetailsDto,
} from '../dtos/responses/subscription-plan-list.dto';
import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';

export interface ISubscriptionPlanQueryService {
  findPlans(
    page: number,
    limit: number,
    search?: string,
    searchType?: SubscriptionPlanSearchField,
  ): Promise<PaginatedSubscriptionPlanListDto>;
  getPlanDetails(id: string): Promise<SubscriptionPlanDetailsDto | null>;
}
