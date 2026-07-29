import { Test, TestingModule } from '@nestjs/testing';

import { CacheContainer } from '../../../infrastructure/cache/container/CacheContainer';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthorizationContainer } from '../../../packages/authorization/authorization.container';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import { Employee } from '../domain/employee.entity';
import { AssignmentNotFoundException } from '../exceptions/assignment-not-found.exception';
import { CrossTenantAssignmentException } from '../exceptions/cross-tenant-assignment.exception';
import { DuplicateAssignmentException } from '../exceptions/duplicate-assignment.exception';
import { DuplicateEmployeeCodeException } from '../exceptions/duplicate-employee-code.exception';
import { EmailAlreadyRegisteredException } from '../exceptions/email-already-registered.exception';
import { EmployeeNotFoundException } from '../exceptions/employee-not-found.exception';
import {
  EMPLOYEE_COMMAND_REPOSITORY_TOKEN,
  EMPLOYEE_QUERY_REPOSITORY_TOKEN,
} from '../tokens/employee-repository.tokens';
import { EmployeeCommandService } from './employee.command.service';

const TENANT_ID = 'tenant-1';
const OTHER_TENANT_ID = 'tenant-2';
const USER_ID = 'user-1';

describe('EmployeeCommandService', () => {
  let service: EmployeeCommandService;
  let commandRepository: Record<string, jest.Mock>;
  let queryRepository: Record<string, jest.Mock>;
  let permissionCache: Record<string, jest.Mock>;
  let requestContext: { getPrincipal: jest.Mock };

  const employee = new Employee(
    'emp-1',
    TENANT_ID,
    USER_ID,
    'EMP-0142',
    'Sara Haddad',
    null,
    true,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  const baseCreateDto = {
    email: 'sara@example.com',
    password: 'S3cure-Passw0rd',
    employeeCode: 'EMP-0142',
    fullName: 'Sara Haddad',
  };

  beforeEach(async () => {
    commandRepository = {
      createUser: jest.fn().mockResolvedValue(USER_ID),
      create: jest.fn().mockResolvedValue('emp-1'),
      update: jest.fn(),
      setActiveState: jest.fn(),
      createAssignment: jest.fn().mockResolvedValue('assign-1'),
      removeAssignment: jest.fn(),
      setAssignmentRoles: jest.fn(),
    };

    queryRepository = {
      findById: jest.fn().mockResolvedValue(employee),
      findByIdWithAssignments: jest.fn(),
      findMany: jest.fn(),
      existsByEmail: jest.fn().mockResolvedValue(false),
      existsByEmployeeCode: jest.fn().mockResolvedValue(false),
      existsAssignment: jest.fn().mockResolvedValue(false),
      findAssignment: jest.fn().mockResolvedValue({
        assignmentId: 'assign-1',
        employeeId: 'emp-1',
        tenantId: TENANT_ID,
      }),
      findOrganizationUnitTenant: jest.fn().mockResolvedValue(TENANT_ID),
      findRoleTenants: jest.fn().mockResolvedValue([]),
    };

    permissionCache = {
      invalidateUserAccess: jest.fn().mockResolvedValue(undefined),
      invalidateRolePermissions: jest.fn().mockResolvedValue(undefined),
    };

    requestContext = {
      getPrincipal: jest.fn().mockReturnValue({ tenantId: TENANT_ID }),
    };

    jest.spyOn(AuthorizationContainer, 'get').mockReturnValue({
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({}),
      buildCapabilities: jest.fn().mockResolvedValue({}),
    } as never);

    jest.spyOn(CacheContainer, 'get').mockReturnValue({
      evict: jest.fn().mockResolvedValue(undefined),
      evictByPrefix: jest.fn().mockResolvedValue(undefined),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeCommandService,
        {
          provide: EMPLOYEE_COMMAND_REPOSITORY_TOKEN,
          useValue: commandRepository,
        },
        {
          provide: EMPLOYEE_QUERY_REPOSITORY_TOKEN,
          useValue: queryRepository,
        },
        { provide: PermissionCacheService, useValue: permissionCache },
        { provide: RequestContextService, useValue: requestContext },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(EmployeeCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createEmployee', () => {
    it('ينشئ الحساب والموظف معاً', async () => {
      const id = await service.createEmployee(baseCreateDto);

      expect(id).toBe('emp-1');
      expect(commandRepository.createUser).toHaveBeenCalled();
      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, userId: USER_ID }),
      );
    });

    it('يخزّن كلمة المرور مُعمّاة لا كنص صريح', async () => {
      await service.createEmployee(baseCreateDto);

      const { passwordHash } = commandRepository.createUser.mock.calls[0][0];

      expect(passwordHash).not.toBe(baseCreateDto.password);
      expect(passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('يرفض بريداً مسجّلاً مسبقاً', async () => {
      queryRepository.existsByEmail.mockResolvedValue(true);

      await expect(service.createEmployee(baseCreateDto)).rejects.toThrow(
        EmailAlreadyRegisteredException,
      );
      expect(commandRepository.createUser).not.toHaveBeenCalled();
    });

    it('يرفض رمز موظف مكرراً داخل الشركة', async () => {
      queryRepository.existsByEmployeeCode.mockResolvedValue(true);

      await expect(service.createEmployee(baseCreateDto)).rejects.toThrow(
        DuplicateEmployeeCodeException,
      );
      expect(commandRepository.createUser).not.toHaveBeenCalled();
    });

    it('يرفض وحدة تنظيمية من شركة أخرى', async () => {
      queryRepository.findOrganizationUnitTenant.mockResolvedValue(
        OTHER_TENANT_ID,
      );

      await expect(
        service.createEmployee({
          ...baseCreateDto,
          organizationUnitId: 'unit-9',
        }),
      ).rejects.toThrow(CrossTenantAssignmentException);
    });

    it('يرفض دوراً من شركة أخرى', async () => {
      queryRepository.findRoleTenants.mockResolvedValue([
        { id: 'role-9', tenantId: OTHER_TENANT_ID },
      ]);

      await expect(
        service.createEmployee({ ...baseCreateDto, roleIds: ['role-9'] }),
      ).rejects.toThrow(CrossTenantAssignmentException);
    });

    it('يرفض دوراً غير موجود', async () => {
      queryRepository.findRoleTenants.mockResolvedValue([]);

      await expect(
        service.createEmployee({ ...baseCreateDto, roleIds: ['ghost'] }),
      ).rejects.toThrow(CrossTenantAssignmentException);
    });
  });

  describe('إبطال كاش الصلاحيات', () => {
    it('يبطل وصول المستخدم عند التعطيل', async () => {
      await service.deactivateEmployee('emp-1');

      expect(commandRepository.setActiveState).toHaveBeenCalledWith(
        'emp-1',
        false,
      );
      expect(permissionCache.invalidateUserAccess).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it('يبطل وصول المستخدم عند التفعيل', async () => {
      await service.activateEmployee('emp-1');

      expect(permissionCache.invalidateUserAccess).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it('يبطل الوصول عند إضافة تعيين', async () => {
      await service.assignEmployee('emp-1', { organizationUnitId: 'unit-1' });

      expect(permissionCache.invalidateUserAccess).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it('يبطل الوصول عند إزالة تعيين', async () => {
      await service.removeAssignment('emp-1', 'assign-1');

      expect(permissionCache.invalidateUserAccess).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it('يبطل الوصول عند تغيير أدوار تعيين', async () => {
      await service.setAssignmentRoles('emp-1', 'assign-1', { roleIds: [] });

      expect(permissionCache.invalidateUserAccess).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it('لا يبطل الكاش عند تعديل الاسم فقط', async () => {
      await service.updateEmployee('emp-1', { fullName: 'Sara H.' });

      expect(permissionCache.invalidateUserAccess).not.toHaveBeenCalled();
    });
  });

  describe('التعيينات', () => {
    it('يرفض تعييناً مكرراً على نفس الوحدة', async () => {
      queryRepository.existsAssignment.mockResolvedValue(true);

      await expect(
        service.assignEmployee('emp-1', { organizationUnitId: 'unit-1' }),
      ).rejects.toThrow(DuplicateAssignmentException);
    });

    it('يرفض تعييناً يخص موظفاً آخر', async () => {
      queryRepository.findAssignment.mockResolvedValue({
        assignmentId: 'assign-9',
        employeeId: 'emp-99',
        tenantId: TENANT_ID,
      });

      await expect(
        service.removeAssignment('emp-1', 'assign-9'),
      ).rejects.toThrow(AssignmentNotFoundException);

      expect(commandRepository.removeAssignment).not.toHaveBeenCalled();
    });

    it('يرمي NotFound عند موظف غير موجود', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(service.deactivateEmployee('missing')).rejects.toThrow(
        EmployeeNotFoundException,
      );
    });

    it('يقبل قائمة أدوار فارغة كسحب كامل', async () => {
      await service.setAssignmentRoles('emp-1', 'assign-1', { roleIds: [] });

      expect(commandRepository.setAssignmentRoles).toHaveBeenCalledWith(
        'assign-1',
        [],
      );
    });
  });
});
