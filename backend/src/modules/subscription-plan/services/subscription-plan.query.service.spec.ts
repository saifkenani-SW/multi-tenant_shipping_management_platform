import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanQueryService } from './subscription-plan.query.service';
import { ISubscriptionPlanQueryRepository } from '../interfaces/subscription-plan.query.repository.interface';
import { SubscriptionPlanSearchField } from '../enums/subscription-plan-search.enum';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

describe('SubscriptionPlanQueryService', () => {
  let service: SubscriptionPlanQueryService;
  let repository: jest.Mocked<ISubscriptionPlanQueryRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ISubscriptionPlanQueryRepository> = {
      findMany: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanQueryService,
        {
          provide: 'ISubscriptionPlanQueryRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionPlanQueryService>(
      SubscriptionPlanQueryService,
    );
    repository = module.get('ISubscriptionPlanQueryRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPlans', () => {
    it('should paginate, forward search filters, invoke mapping, and return metadata', async () => {
      const now = new Date();
      const mockRows: SubscriptionPlan[] = [
        new SubscriptionPlan(
          '1',
          'Plan 1',
          null,
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          10,
          100,
          true,
          now,
          now,
        ),
      ];

      repository.findMany.mockResolvedValue([mockRows, 100]);

      const result = await service.findPlans(
        2,
        10,
        'search-term',
        SubscriptionPlanSearchField.NAME,
      );

      expect(repository.findMany).toHaveBeenCalledTimes(1);
      expect(repository.findMany).toHaveBeenCalledWith(
        10,
        10,
        'search-term',
        SubscriptionPlanSearchField.NAME,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toEqual(mockRows[0].id);
      expect(result.meta).toEqual({
        total: 100,
        page: 2,
        limit: 10,
      });
    });
  });

  describe('getPlanDetails', () => {
    it('should return null if the plan is not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.getPlanDetails('non-existent');

      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should invoke mapping and return DTO if the plan is found', async () => {
      const now = new Date();
      const mockRow = new SubscriptionPlan(
        '1',
        'Plan 1',
        null,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        10,
        100,
        true,
        now,
        now,
      );

      repository.findById.mockResolvedValue(mockRow);

      const result = await service.getPlanDetails('1');

      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result?.id).toEqual(mockRow.id);
    });
  });
});
