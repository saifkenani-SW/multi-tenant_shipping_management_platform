import { Test, TestingModule } from '@nestjs/testing';

import { CacheContainer } from '../../../infrastructure/cache/container/CacheContainer';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthorizationContainer } from '../../../packages/authorization/authorization.container';
import { TransactionContainer } from '../../../packages/transaction';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import { Role } from '../domain/role.entity';
import { DuplicateRoleNameException } from '../exceptions/duplicate-role-name.exception';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import { RoleInUseException } from '../exceptions/role-in-use.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { UnknownPermissionException } from '../exceptions/unknown-permission.exception';
import {
  ROLE_COMMAND_REPOSITORY_TOKEN,
  ROLE_QUERY_REPOSITORY_TOKEN,
} from '../tokens/role-repository.tokens';
import { RoleCommandService } from './role.command.service';

const TENANT_ID = 'tenant-1';

describe('RoleCommandService', () => {
  let service: RoleCommandService;
  let commandRepository: Record<string, jest.Mock>;
  let queryRepository: Record<string, jest.Mock>;
  let permissionCache: Record<string, jest.Mock>;
  let requestContext: { getPrincipal: jest.Mock };

  const existingRole = new Role(
    'role-1',
    TENANT_ID,
    'Branch Manager',
    null,
    true,
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    commandRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setPermissions: jest.fn(),
      findExistingPermissionIds: jest.fn().mockResolvedValue([]),
    };

    queryRepository = {
      findById: jest.fn(),
      existsByName: jest.fn().mockResolvedValue(false),
      countAssignments: jest.fn().mockResolvedValue(0),
    };

    permissionCache = {
      invalidateRolePermissions: jest.fn().mockResolvedValue(undefined),
      invalidateUserAccess: jest.fn().mockResolvedValue(undefined),
    };

    requestContext = {
      getPrincipal: jest.fn().mockReturnValue({ tenantId: TENANT_ID }),
    };

    jest.spyOn(AuthorizationContainer, 'get').mockReturnValue({
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({}),
      buildCapabilities: jest.fn().mockResolvedValue({}),
    } as never);

    jest.spyOn(TransactionContainer, 'get').mockReturnValue({
      execute: jest.fn(async (fn) => fn({})),
    } as never);

    // @CacheEvict يسحب الـ facade من حاوية عامة تُهيَّأ عند الإقلاع فقط
    jest.spyOn(CacheContainer, 'get').mockReturnValue({
      evict: jest.fn().mockResolvedValue(undefined),
      evictByPrefix: jest.fn().mockResolvedValue(undefined),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleCommandService,
        {
          provide: ROLE_COMMAND_REPOSITORY_TOKEN,
          useValue: commandRepository,
        },
        { provide: ROLE_QUERY_REPOSITORY_TOKEN, useValue: queryRepository },
        { provide: PermissionCacheService, useValue: permissionCache },
        { provide: RequestContextService, useValue: requestContext },
        {
          provide: PrismaService,
          // @Transactional() يعيد استخدام المعاملة أو يفتح واحدة عبر $transaction
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(RoleCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createRole', () => {
    it('ينشئ الدور ويرجّع معرّفه', async () => {
      commandRepository.create.mockResolvedValue(existingRole);

      const id = await service.createRole({ name: 'Branch Manager' });

      expect(id).toBe('role-1');
      expect(commandRepository.create).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        name: 'Branch Manager',
        description: null,
      });
    });

    it('يرفض اسماً مكرراً داخل نفس الـ tenant', async () => {
      queryRepository.existsByName.mockResolvedValue(true);

      await expect(
        service.createRole({ name: 'Branch Manager' }),
      ).rejects.toThrow(DuplicateRoleNameException);
      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('يرفض الإنشاء بلا سياق tenant', async () => {
      requestContext.getPrincipal.mockReturnValue({ tenantId: undefined });

      await expect(service.createRole({ name: 'X' })).rejects.toThrow(
        MissingTenantContextException,
      );
    });

    it('يرفض صلاحية غير موجودة في الكتالوج', async () => {
      commandRepository.create.mockResolvedValue(existingRole);
      commandRepository.findExistingPermissionIds.mockResolvedValue(['perm-1']);

      await expect(
        service.createRole({
          name: 'Branch Manager',
          permissionIds: ['perm-1', 'ghost-perm'],
        }),
      ).rejects.toThrow(UnknownPermissionException);

      expect(commandRepository.setPermissions).not.toHaveBeenCalled();
    });

    it('يربط الصلاحيات عند تمريرها', async () => {
      commandRepository.create.mockResolvedValue(existingRole);
      commandRepository.findExistingPermissionIds.mockResolvedValue(['perm-1']);

      await service.createRole({
        name: 'Branch Manager',
        permissionIds: ['perm-1'],
      });

      expect(commandRepository.setPermissions).toHaveBeenCalledWith('role-1', [
        'perm-1',
      ]);
    });
  });

  describe('updateRole', () => {
    it('يرمي RoleNotFoundException عند الغياب', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateRole('missing', { name: 'X' }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('يسمح بإبقاء نفس الاسم دون اعتباره تكراراً', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);

      await service.updateRole('role-1', { name: 'Branch Manager' });

      expect(queryRepository.existsByName).not.toHaveBeenCalled();
      expect(commandRepository.update).toHaveBeenCalled();
    });

    it('يرفض التغيير إلى اسم مستخدم', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);
      queryRepository.existsByName.mockResolvedValue(true);

      await expect(
        service.updateRole('role-1', { name: 'Warehouse Lead' }),
      ).rejects.toThrow(DuplicateRoleNameException);
    });

    it('يبطل كاش الصلاحيات عند تعطيل الدور', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);

      await service.updateRole('role-1', { isActive: false });

      expect(permissionCache.invalidateRolePermissions).toHaveBeenCalledWith(
        'role-1',
      );
    });

    it('لا يبطل الكاش عند تعديل الوصف فقط', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);

      await service.updateRole('role-1', { description: 'updated' });

      expect(permissionCache.invalidateRolePermissions).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('يمنع الحذف ما دام الدور مُسنَداً', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);
      queryRepository.countAssignments.mockResolvedValue(3);

      await expect(service.deleteRole('role-1')).rejects.toThrow(
        RoleInUseException,
      );
      expect(commandRepository.delete).not.toHaveBeenCalled();
    });

    it('يحذف ويبطل الكاش عند عدم وجود إسنادات', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);
      queryRepository.countAssignments.mockResolvedValue(0);

      await service.deleteRole('role-1');

      expect(commandRepository.delete).toHaveBeenCalledWith('role-1');
      expect(permissionCache.invalidateRolePermissions).toHaveBeenCalledWith(
        'role-1',
      );
    });

    it('يرمي RoleNotFoundException عند الغياب', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(service.deleteRole('missing')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('setRolePermissions', () => {
    it('يستبدل المجموعة ويبطل الكاش', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);
      commandRepository.findExistingPermissionIds.mockResolvedValue([
        'perm-1',
        'perm-2',
      ]);

      await service.setRolePermissions('role-1', {
        permissionIds: ['perm-1', 'perm-2'],
      });

      expect(commandRepository.setPermissions).toHaveBeenCalledWith('role-1', [
        'perm-1',
        'perm-2',
      ]);
      expect(permissionCache.invalidateRolePermissions).toHaveBeenCalledWith(
        'role-1',
      );
    });

    it('يقبل قائمة فارغة كسحب لكل الصلاحيات', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);

      await service.setRolePermissions('role-1', { permissionIds: [] });

      expect(commandRepository.setPermissions).toHaveBeenCalledWith(
        'role-1',
        [],
      );
      expect(permissionCache.invalidateRolePermissions).toHaveBeenCalled();
    });

    it('لا يبطل الكاش إذا فشل التحقق من الصلاحيات', async () => {
      queryRepository.findById.mockResolvedValue(existingRole);
      commandRepository.findExistingPermissionIds.mockResolvedValue([]);

      await expect(
        service.setRolePermissions('role-1', { permissionIds: ['ghost'] }),
      ).rejects.toThrow(UnknownPermissionException);

      expect(permissionCache.invalidateRolePermissions).not.toHaveBeenCalled();
    });
  });
});
