import { Test, TestingModule } from '@nestjs/testing';
import { TenantQueryService } from './tenant.query.service';
import { TenantStatus } from '../enums/tenant-status.enum';
import { Tenant } from '../domain/tenant.entity';

describe('TenantQueryService', () => {
  let service: TenantQueryService;
  let tenantQueryRepository: any;

  beforeEach(async () => {
    tenantQueryRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQueryService,
        { provide: 'ITenantQueryRepository', useValue: tenantQueryRepository },
      ],
    }).compile();

    service = module.get<TenantQueryService>(TenantQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findTenants', () => {
    it('should fetch from repository and return mapped list', async () => {
      const mockTenants = [
        new Tenant(
          '1',
          'Tenant A',
          TenantStatus.ACTIVE,
          '',
          '',
          new Date('2023-01-01'),
          new Date('2023-01-01'),
        ),
      ];
      tenantQueryRepository.findMany.mockResolvedValue([mockTenants, 1]);

      const result = await service.findTenants(1, 10);

      expect(tenantQueryRepository.findMany).toHaveBeenCalledWith(
        0,
        10,
        undefined,
        undefined,
      );

      // Ensure mapping is correct
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].status).toBe('ACTIVE');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('getTenantDetails', () => {
    it('should return null if tenant not found in repository', async () => {
      tenantQueryRepository.findById.mockResolvedValue(null);

      const result = await service.getTenantDetails('missing-id');

      expect(result).toBeNull();
      expect(tenantQueryRepository.findById).toHaveBeenCalledWith('missing-id');
    });

    it('should return mapped details if found in repository', async () => {
      const mockTenant = new Tenant(
        '2',
        'Tenant B',
        TenantStatus.SUSPENDED,
        'TX1',
        'b@b.com',
        new Date('2023-01-01'),
        new Date('2023-01-02'),
      );
      tenantQueryRepository.findById.mockResolvedValue(mockTenant);

      const result = await service.getTenantDetails('2');

      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
      expect(result?.status).toBe('SUSPENDED');
      expect(result?.taxNumber).toBe('TX1');
      expect(tenantQueryRepository.findById).toHaveBeenCalledWith('2');
    });
  });
});
