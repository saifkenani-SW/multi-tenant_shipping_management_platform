import { Test, TestingModule } from '@nestjs/testing';

import { Pagination } from '../../../common/pagination';
import { AuthorizationContainer } from '../../../packages/authorization/authorization.container';
import { TransactionContainer } from '../../../packages/transaction';
import { PermissionQueryCriteriaBuilder } from '../builders/query/permission-query-criteria.builder';
import { Permission } from '../domain/permission.entity';
import { PermissionQueryDto } from '../dtos/requests/permission-query.dto';
import { PermissionSearchField } from '../enums/permission-search-field.enum';
import { PermissionNotFoundException } from '../exceptions/permission-not-found.exception';
import { PermissionResponseMapper } from '../mappers/response/permission.response.mapper';
import { PERMISSION_QUERY_REPOSITORY_TOKEN } from '../tokens/permission-repository.tokens';
import { PermissionQueryService } from './permission.query.service';

describe('PermissionQueryService', () => {
  let service: PermissionQueryService;
  let repository: { findMany: jest.Mock; findById: jest.Mock };

  const permission = new Permission(
    'perm-1',
    'CREATE_PARCEL',
    'parcel',
    'create',
    'Create parcels',
  );

  beforeEach(async () => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByRoleId: jest.fn(),
    } as never;

    // الديكوراتورات تسحب الـ facade من حاوية عامة تُهيَّأ عند الإقلاع فقط
    jest.spyOn(AuthorizationContainer, 'get').mockReturnValue({
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({}),
      buildCapabilities: jest.fn().mockResolvedValue({ canView: true }),
    } as never);
    jest.spyOn(TransactionContainer, 'get').mockReturnValue({
      execute: jest.fn(async (fn) => fn({})),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionQueryService,
        PermissionQueryCriteriaBuilder,
        PermissionResponseMapper,
        {
          provide: PERMISSION_QUERY_REPOSITORY_TOKEN,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(PermissionQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('findPermissions', () => {
    it('يحوّل نتائج المستودع إلى قائمة مرقّمة', async () => {
      repository.findMany.mockResolvedValue([[permission], 1]);

      const query = new PermissionQueryDto();
      query.page = 1;
      query.limit = 10;

      const result = await service.findPermissions(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'perm-1',
        name: 'CREATE_PARCEL',
        resource: 'parcel',
        action: 'create',
      });
      expect(result.meta).toMatchObject({ page: 1, limit: 10, total: 1 });
    });

    it('يُلحق الـ scope بالـ meta عبر ReturnVisibilityScope', async () => {
      repository.findMany.mockResolvedValue([[permission], 1]);

      const query = new PermissionQueryDto();
      query.page = 1;
      query.limit = 10;

      const result = await service.findPermissions(query);

      // كتالوج عام: الـ scope فارغ، لكن وجوده يثبت مرور الديكوراتور
      expect((result.meta as unknown as { scope: unknown }).scope).toEqual({});
    });

    it('يمرّر معايير البحث والمورد للمستودع', async () => {
      repository.findMany.mockResolvedValue([[], 0]);

      const query = new PermissionQueryDto();
      query.page = 2;
      query.limit = 5;
      query.search = 'parcel';
      query.searchType = PermissionSearchField.RESOURCE;
      query.resource = 'parcel';

      await service.findPermissions(query);

      const criteria = repository.findMany.mock.calls[0][0];
      expect(criteria.search).toEqual({
        keyword: 'parcel',
        field: PermissionSearchField.RESOURCE,
      });
      expect(criteria.resource).toBe('parcel');
      expect(criteria.pagination).toBeInstanceOf(Pagination);
      expect(criteria.pagination.skip).toBe(5);
      expect(criteria.pagination.take).toBe(5);
    });

    it('لا يبني معايير بحث عند غياب الكلمة', async () => {
      repository.findMany.mockResolvedValue([[], 0]);

      const query = new PermissionQueryDto();
      query.page = 1;
      query.limit = 10;

      await service.findPermissions(query);

      expect(repository.findMany.mock.calls[0][0].search).toBeUndefined();
    });
  });

  describe('getPermissionDetails', () => {
    it('يرجّع التفاصيل عند الوجود', async () => {
      repository.findById.mockResolvedValue(permission);

      const result = await service.getPermissionDetails('perm-1');

      expect(result).toEqual({
        id: 'perm-1',
        name: 'CREATE_PARCEL',
        resource: 'parcel',
        action: 'create',
        description: 'Create parcels',
      });
      expect(repository.findById).toHaveBeenCalledWith('perm-1');
    });

    it('يرمي PermissionNotFoundException عند الغياب', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getPermissionDetails('missing')).rejects.toThrow(
        PermissionNotFoundException,
      );
    });
  });
});
