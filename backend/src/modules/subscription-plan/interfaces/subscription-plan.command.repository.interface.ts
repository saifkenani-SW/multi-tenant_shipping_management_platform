import { SubscriptionPlan } from '../domain/subscription-plan.entity';

export interface ISubscriptionPlanCommandRepository {
  create(data: {
    name: string;
    description?: string;
    max_branches: number;
    max_warehouses: number;
    max_employees: number;
    max_vehicles: number;
    max_zones: number;
    max_monthly_shipments?: number | null;
    max_monthly_parcels?: number | null;
    price_monthly: number;
    price_yearly?: number | null;
    is_active: boolean;
  }): Promise<SubscriptionPlan>;

  findById(id: string): Promise<SubscriptionPlan | null>;

  update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      max_branches: number;
      max_warehouses: number;
      max_employees: number;
      max_vehicles: number;
      max_zones: number;
      max_monthly_shipments: number | null;
      max_monthly_parcels: number | null;
      price_monthly: number;
      price_yearly: number | null;
    }>,
  ): Promise<void>;

  updateStatus(id: string, isActive: boolean): Promise<void>;
}
