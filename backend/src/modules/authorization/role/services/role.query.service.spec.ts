import { Test, TestingModule } from '@nestjs/testing';

import { AuthorizationFacade } from '../../../../packages/authorization';
import { AuthorizationContainer } from '../../../../packages/authorization/authorization.container';
import { Permission } from '../../permission/domain/permission.entity';
import { PermissionResponseMapper } from '../../permission/mappers/response/permission.response.mapper';
import { RoleQueryCriteriaBuilder } from '../builders/query/role-query-criteria.builder';
import { Role } from '../domain/role.entity';
import { RoleQueryDto } from '../dtos/requests/role-query.dto';
import { RoleSearchField } from '../enums/role-search-field.enum';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { RoleResponseMapper } from '../mappers/response/role.response.mapper';
import { ROLE_QUERY_REPOSITORY_TOKEN } from '../tokens/role-repository.tokens';
import { RoleQueryService } from './role.query.service';

describe('RoleQueryService', () => {
  let service: RoleQueryService;
  let repository: Record<string, jest.Mock>;
  let authorizationFacade: Record<string, jest.Mock>;

  const permission = new Permission(
    'perm-1',
    'MANAGE_ROLES',
    'role',
    'manage',
    'Manage roles',
  );

  const role = new Role(
    'role-1',
    'tenant-1',
    'Branch Manager',
    'Runs a branch',
    true,
    new Date('2024-01-01'),
    [permission],
  );

  beforeEach(async () => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByIdWithPermissions: jest.fn(),
      countAssignments: jest.fn(),
      existsByName: jest.fn(),
    };

    authorizationFacade = {
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({ tenantId: 'tenant-1' }),
      buildCapabilities: jest.fn().mockResolvedValue({
        canUpdate: true,
        canDelete: false,
        canManagePermissions: true,
      }),
    };

    jest
      .spyOn(AuthorizationContainer, 'get')
      .mockReturnValue(authorizationFacade as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleQueryService,
        RoleQueryCriteriaBuilder,
        RoleResponseMapper,
        PermissionResponseMapper,
        { provide: ROLE_QUERY_REPOSITORY_TOKEN, useValue: repository },
        { provide: AuthorizationFacade, useValue: authorizationFacade },
      ],
    }).compile();

    service = module.get(RoleQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('findRoles', () => {
    it('يقصر الاستعلام على الـ tenant القادم من الـ scope', async () => {
      repository.findMany.mockResolvedValue([[role], 1]);

      const query = new RoleQueryDto();
      query.page = 1;
      query.limit = 10;

      await service.findRoles(query);

      expect(repository.findMany.mock.calls[0][0].tenantId).toBe('tenant-1');
    });

    it('يرجّع عدد الصلاحيات لا قائمتها في القائمة', async () => {
      repository.findMany.mockResolvedValue([[role], 1]);

      const query = new RoleQueryDto();
      query.page = 1;
      query.limit = 10;

      const result = await service.findRoles(query);

      expect(result.data[0]).toEqual({
        id: 'role-1',
        name: 'Branch Manager',
        description: 'Runs a branch',
        isActive: true,
        permissionCount: 1,
        createdAt: role.createdAt,
      });
    });

    it('يمرّر فلتر isActive ومعايير البحث', async () => {
      repository.findMany.mockResolvedValue([[], 0]);

      const query = new RoleQueryDto();
      query.page = 1;
      query.limit = 10;
      query.search = 'manager';
      query.searchType = RoleSearchField.DESCRIPTION;
      query.isActive = false;

      await service.findRoles(query);

      const criteria = repository.findMany.mock.calls[0][0];
      expect(criteria.search).toEqual({
        keyword: 'manager',
        field: RoleSearchField.DESCRIPTION,
      });
      expect(criteria.isActive).toBe(false);
    });
  });

  describe('getRoleDetails', () => {
    it('يرجّع التفاصيل مع الصلاحيات', async () => {
      repository.findByIdWithPermissions.mockResolvedValue(role);

      const result = await service.getRoleDetails('role-1');

      expect(result.id).toBe('role-1');
      expect(result.tenantId).toBe('tenant-1');
      expect(result.permissions).toEqual([
        {
          id: 'perm-1',
          name: 'MANAGE_ROLES',
          resource: 'role',
          action: 'manage',
        },
      ]);
    });

    it('يرمي RoleNotFoundException عند الغياب', async () => {
      repository.findByIdWithPermissions.mockResolvedValue(null);

      await expect(service.getRoleDetails('missing')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });
});
