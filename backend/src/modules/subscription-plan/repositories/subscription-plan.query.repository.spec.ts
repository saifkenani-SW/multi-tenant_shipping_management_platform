import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanQueryRepository } from './subscription-plan.query.repository';
import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';
import { CacheContainer } from '../../../infrastructure/cache/container/CacheContainer';

describe('SubscriptionPlanQueryRepository', () => {
  let repository: SubscriptionPlanQueryRepository;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
  };

  const mockKysely = {
    selectFrom: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.spyOn(CacheContainer, 'get').mockReturnValue({
      remember: jest.fn((key, loader) => loader()),
      rememberMany: jest.fn((prefix, ids, loader) => loader(ids)),
      evict: jest.fn(),
      evictByPrefix: jest.fn(),
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanQueryRepository,
        {
          provide: 'KYSELY_INSTANCE',
          useValue: mockKysely,
        },

      ],
    }).compile();

    repository = module.get<SubscriptionPlanQueryRepository>(
      SubscriptionPlanQueryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('findMany', () => {
    it('should query kysely with explicit selects, pagination, and return mapped Entity', async () => {
      const now = new Date();
      const mockRows = [
        {
          id: '1',
          name: 'Basic',
          description: null,
          max_branches: 1,
          max_warehouses: 1,
          max_employees: 1,
          max_vehicles: 1,
          max_zones: 1,
          max_monthly_shipments: 1,
          max_monthly_parcels: 1,
          price_monthly: '10.0',
          price_yearly: '100.0',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ];
      mockQueryBuilder.execute.mockResolvedValueOnce(mockRows);
      mockQueryBuilder.executeTakeFirst.mockResolvedValueOnce({ count: '100' });

      const [items, count] = await repository.findMany(0, 10);

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('subscription_plan');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'created_at',
        'desc',
      );
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(items).toHaveLength(1);
      expect(items[0]).toBeInstanceOf(SubscriptionPlan);
      expect(items[0].id).toBe('1');
      expect(count).toBe(100);
    });

    it('should apply where clause when search and searchType are provided', async () => {
      mockQueryBuilder.execute.mockResolvedValueOnce([]);
      mockQueryBuilder.executeTakeFirst.mockResolvedValueOnce({ count: '0' });

      await repository.findMany(0, 10, 'pro', SubscriptionPlanSearchField.NAME);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'name',
        'ilike',
        '%pro%',
      );
    });
  });

  describe('findById', () => {
    it('should return null if the plan is not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValueOnce(undefined);

      const result = await repository.findById('non-existent');

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('subscription_plan');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'id',
        '=',
        'non-existent',
      );
      expect(mockQueryBuilder.executeTakeFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return the mapped plan Entity if found', async () => {
      const now = new Date();
      const mockRow = {
        id: '1',
        name: 'Basic',
        description: null,
        max_branches: 1,
        max_warehouses: 1,
        max_employees: 1,
        max_vehicles: 1,
        max_zones: 1,
        max_monthly_shipments: 1,
        max_monthly_parcels: 1,
        price_monthly: '10.0',
        price_yearly: '100.0',
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      mockQueryBuilder.executeTakeFirst.mockResolvedValueOnce(mockRow);

      const result = await repository.findById('1');

      expect(result).toBeInstanceOf(SubscriptionPlan);
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('Basic');
    });
  });
});
