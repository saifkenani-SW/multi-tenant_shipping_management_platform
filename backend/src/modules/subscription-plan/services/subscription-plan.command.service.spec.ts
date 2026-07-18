import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanCommandService } from './subscription-plan.command.service';
import { ISubscriptionPlanCommandRepository } from '../interfaces/subscription-plan.command.repository.interface';
import { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { CreateSubscriptionPlanDto } from '../dtos/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dtos/requests/update-subscription-plan.dto';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';

describe('SubscriptionPlanCommandService', () => {
  let service: SubscriptionPlanCommandService;
  let repository: jest.Mocked<ISubscriptionPlanCommandRepository>;
  let cacheProvider: jest.Mocked<ICacheProvider>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ISubscriptionPlanCommandRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockCacheProvider: jest.Mocked<ICacheProvider> = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
      clearByPrefix: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanCommandService,
        {
          provide: 'ISubscriptionPlanCommandRepository',
          useValue: mockRepository,
        },
        {
          provide: 'ICacheProvider',
          useValue: mockCacheProvider,
        },
      ],
    }).compile();

    service = module.get<SubscriptionPlanCommandService>(
      SubscriptionPlanCommandService,
    );
    repository = module.get('ISubscriptionPlanCommandRepository');
    cacheProvider = module.get('ICacheProvider');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlan', () => {
    it('should map the DTO, call the repository, and return the generated id', async () => {
      const dto: CreateSubscriptionPlanDto = { name: 'Test Plan' };

      repository.create.mockResolvedValue({
        id: 'plan-123',
      } as SubscriptionPlan);

      const result = await service.createPlan(dto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result).toBe('plan-123');
    });
  });

  describe('updatePlan', () => {
    it('should map the DTO and call the repository update', async () => {
      const dto: UpdateSubscriptionPlanDto = { name: 'Updated Plan' };

      repository.update.mockResolvedValue();

      await service.updatePlan('plan-123', dto);

      expect(repository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('deactivatePlan', () => {
    it('should call repository updateStatus with false', async () => {
      repository.updateStatus.mockResolvedValue();

      await service.deactivatePlan('plan-123');

      expect(repository.updateStatus).toHaveBeenCalledTimes(1);
      expect(repository.updateStatus).toHaveBeenCalledWith('plan-123', false);
    });
  });

  describe('activatePlan', () => {
    it('should call repository updateStatus with true', async () => {
      repository.updateStatus.mockResolvedValue();

      await service.activatePlan('plan-123');

      expect(repository.updateStatus).toHaveBeenCalledTimes(1);
      expect(repository.updateStatus).toHaveBeenCalledWith('plan-123', true);
    });
  });
});
