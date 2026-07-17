import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../core/transaction';
import { ISubscriptionPlanCommandRepository } from '../interfaces/subscription-plan.command.repository.interface';
import { Prisma } from '@prisma/client';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

@Injectable()
export class SubscriptionPlanCommandRepository implements ISubscriptionPlanCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: {
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
  }): Promise<SubscriptionPlan> {
    const result = await this.prisma.client.subscription_plan.create({
      data: {
        name: data.name,
        description: data.description,
        max_branches: data.max_branches,
        max_warehouses: data.max_warehouses,
        max_employees: data.max_employees,
        max_vehicles: data.max_vehicles,
        max_zones: data.max_zones,
        max_monthly_shipments: data.max_monthly_shipments,
        max_monthly_parcels: data.max_monthly_parcels,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        is_active: data.is_active,
      },
    });
    
    return new SubscriptionPlan(
      result.id,
      result.name,
      result.description,
      result.max_branches,
      result.max_warehouses,
      result.max_employees,
      result.max_vehicles,
      result.max_zones,
      result.max_monthly_shipments,
      result.max_monthly_parcels,
      Number(result.price_monthly),
      Number(result.price_yearly),
      result.is_active,
      result.created_at,
      result.updated_at,
    );
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const plan = await this.prisma.client.subscription_plan.findUnique({
      where: { id },
    });
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
      Number(plan.price_yearly),
      plan.is_active,
      plan.created_at,
      plan.updated_at,
    );
  }

  async update(
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
  ): Promise<void> {
    try {
      await this.prisma.client.subscription_plan.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Subscription plan not found');
      }
      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.prisma.client.subscription_plan.update({
        where: { id },
        data: { is_active: isActive },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Subscription plan not found');
      }
      throw error;
    }
  }
}
