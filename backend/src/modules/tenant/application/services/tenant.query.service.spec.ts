import { Test, TestingModule } from '@nestjs/testing';
import { TenantQueryService } from './tenant.query.service';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantQueryRepository } from '../../infrastructure/repositories/tenant.query.repository';
import { AuthorizationFacade } from '../../../../packages/authorization';
import { AuthorizationContainer } from '../../../../packages/authorization/authorization.container';
import { TenantQueryCriteriaBuilder } from '../builders/query/tenant-query-criteria.builder';
import { TenantResponseMapper } from '../mappers/tenant.response.mapper';
import { UserFacade } from '../../../user/application/facades/user.facade';
import { TenantQueryCriteria } from '../builders/query/tenant-query-criteria';
import { TenantNotFoundException } from '../../domain/exceptions/tenant-not-found.exception';
import { Pagination } from '../../../../common/pagination';

describe('TenantQueryService', () => {
  let service: TenantQueryService;
  let tenantQueryRepository: any;
  let authorizationFacade: any;

  beforeEach(async () => {
    tenantQueryRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
    };

    authorizationFacade = {
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({
        tenantId: 'scope-tenant-id',
      }),
      buildCapabilities: jest.fn().mockResolvedValue({
        canUpdate: false,
        canDelete: false,
      }),
    };

    jest
      .spyOn(AuthorizationContainer, 'get')
      .mockReturnValue(authorizationFacade);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQueryService,
        {
          provide: TenantQueryRepository,
          useValue: tenantQueryRepository,
        },
        { provide: AuthorizationFacade, useValue: authorizationFacade },
        {
          provide: UserFacade,
          useValue: {},
        },
        TenantQueryCriteriaBuilder,
        TenantResponseMapper,
      ],
    }).compile();

    service = module.get<TenantQueryService>(TenantQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

      const result = await service.findTenants({
        page: 1,
        limit: 10,
      } as any);

      const criteria = tenantQueryRepository.findMany.mock
        .calls[0][0] as TenantQueryCriteria;

      expect(criteria.pagination).toBeInstanceOf(Pagination);
      expect(criteria.pagination.skip).toBe(0);
      expect(criteria.pagination.take).toBe(10);
      expect(criteria.tenantId).toBe('scope-tenant-id');

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
    it('should throw TenantNotFoundException if tenant not found in repository', async () => {
      tenantQueryRepository.findById.mockResolvedValue(null);

      await expect(service.getTenantDetails('missing-id')).rejects.toThrow(
        TenantNotFoundException,
      );
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
      expect(result?.email).toBe('b@b.com');
      expect(result?.phone).toBeNull();
      expect(result?.logoUrl).toBeNull();
      expect(result?.suspendedAt).toBeNull();
      expect(result?.suspendedReason).toBeNull();
      expect(result?.capabilities).toEqual({
        canUpdate: false,
        canDelete: false,
      });
      expect(tenantQueryRepository.findById).toHaveBeenCalledWith('2');
    });
  });
});
