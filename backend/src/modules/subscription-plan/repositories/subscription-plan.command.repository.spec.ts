import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanCommandRepository } from './subscription-plan.command.repository';
import { TransactionalPrismaService } from '../../../core/transaction';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('SubscriptionPlanCommandRepository', () => {
  let repository: SubscriptionPlanCommandRepository;
  let prisma: jest.Mocked<TransactionalPrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      client: {
        subscription_plan: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanCommandRepository,
        {
          provide: TransactionalPrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<SubscriptionPlanCommandRepository>(
      SubscriptionPlanCommandRepository,
    );
    prisma = module.get(TransactionalPrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should map the payload correctly and return the Domain Entity', async () => {
      const data = {
        name: 'Basic',
        description: 'Basic desc',
        max_branches: 5,
        max_warehouses: 2,
        max_employees: 20,
        max_vehicles: 10,
        max_zones: 3,
        max_monthly_shipments: 10,
        max_monthly_parcels: 10,
        price_monthly: 0,
        price_yearly: 0,
        is_active: true,
      };

      const now = new Date();
      (prisma.client.subscription_plan.create as jest.Mock).mockResolvedValue({
        id: 'gen-id-123',
        ...data,
        created_at: now,
        updated_at: now,
      } as any);

      const result = await repository.create(data);

      expect(prisma.client.subscription_plan.create).toHaveBeenCalledTimes(1);
      expect(prisma.client.subscription_plan.create).toHaveBeenCalledWith({
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
      expect(result.id).toBe('gen-id-123');
      expect(result.name).toBe('Basic');
    });
  });

  describe('update', () => {
    it('should map the payload correctly and call update', async () => {
      const data = {
        name: 'Updated Basic',
      };

      (prisma.client.subscription_plan.update as jest.Mock).mockResolvedValue({} as any);

      await repository.update('plan-123', data);

      expect(prisma.client.subscription_plan.update).toHaveBeenCalledTimes(1);
      expect(prisma.client.subscription_plan.update).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
        data,
      });
    });

    it('should throw NotFoundException if Prisma throws P2025 error', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found.',
        {
          code: 'P2025',
          clientVersion: '5.x',
        },
      );
      (prisma.client.subscription_plan.update as jest.Mock).mockRejectedValue(p2025Error);

      await expect(repository.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update only the is_active status', async () => {
      (prisma.client.subscription_plan.update as jest.Mock).mockResolvedValue({} as any);

      await repository.updateStatus('plan-123', false);

      expect(prisma.client.subscription_plan.update).toHaveBeenCalledTimes(1);
      expect(prisma.client.subscription_plan.update).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
        data: { is_active: false },
      });
    });
  });
});
