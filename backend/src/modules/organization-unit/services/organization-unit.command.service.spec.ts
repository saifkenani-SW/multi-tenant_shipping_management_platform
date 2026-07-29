import { Test, TestingModule } from '@nestjs/testing';

import { CacheContainer } from '../../../infrastructure/cache/container/CacheContainer';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthorizationContainer } from '../../../packages/authorization/authorization.container';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { OrganizationUnit } from '../domain/organization-unit.entity';
import { OrgType } from '../enums/org-type.enum';
import { CrossTenantParentException } from '../exceptions/cross-tenant-parent.exception';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import { OrganizationUnitHasChildrenException } from '../exceptions/organization-unit-has-children.exception';
import { OrganizationUnitInUseException } from '../exceptions/organization-unit-in-use.exception';
import { OrganizationUnitNotFoundException } from '../exceptions/organization-unit-not-found.exception';
import { UnknownCoverageLocationException } from '../exceptions/unknown-coverage-location.exception';
import {
  ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN,
  ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
} from '../tokens/organization-unit-repository.tokens';
import { OrganizationUnitCommandService } from './organization-unit.command.service';

const TENANT_ID = 'tenant-1';
const OTHER_TENANT_ID = 'tenant-2';

describe('OrganizationUnitCommandService', () => {
  let service: OrganizationUnitCommandService;
  let commandRepository: Record<string, jest.Mock>;
  let queryRepository: Record<string, jest.Mock>;
  let requestContext: { getPrincipal: jest.Mock };

  const ownUnit = new OrganizationUnit(
    'unit-1',
    TENANT_ID,
    'Amman Main Branch',
    OrgType.BRANCH,
  );

  const foreignUnit = new OrganizationUnit(
    'unit-9',
    OTHER_TENANT_ID,
    'Other Tenant Hub',
    OrgType.HUB,
  );

  beforeEach(async () => {
    commandRepository = {
      create: jest.fn().mockResolvedValue('new-unit'),
      update: jest.fn(),
      delete: jest.fn(),
      setCoverage: jest.fn(),
    };

    queryRepository = {
      findById: jest.fn(),
      findByIdWithCoverage: jest.fn(),
      findAncestors: jest.fn(),
      findMany: jest.fn(),
      countChildren: jest.fn().mockResolvedValue(0),
      countActiveAssignments: jest.fn().mockResolvedValue(0),
      findExistingLocationIds: jest.fn().mockResolvedValue([]),
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
        OrganizationUnitCommandService,
        {
          provide: ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN,
          useValue: commandRepository,
        },
        {
          provide: ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
          useValue: queryRepository,
        },
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

    service = module.get(OrganizationUnitCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('عزل الـ tenant', () => {
    it('يرفض أباً من شركة أخرى', async () => {
      queryRepository.findById.mockResolvedValue(foreignUnit);

      await expect(
        service.createUnit({
          name: 'Rogue Branch',
          orgType: OrgType.BRANCH,
          parentId: 'unit-9',
        }),
      ).rejects.toThrow(CrossTenantParentException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('يقبل أباً من نفس الشركة', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);

      await service.createUnit({
        name: 'Sub Branch',
        orgType: OrgType.BRANCH,
        parentId: 'unit-1',
      });

      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, parentId: 'unit-1' }),
      );
    });

    it('يرمي NotFound عند أب غير موجود', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(
        service.createUnit({
          name: 'X',
          orgType: OrgType.BRANCH,
          parentId: 'ghost',
        }),
      ).rejects.toThrow(OrganizationUnitNotFoundException);
    });

    it('ينشئ جذراً بلا أب دون فحص', async () => {
      await service.createUnit({ name: 'HQ', orgType: OrgType.REGION });

      expect(queryRepository.findById).not.toHaveBeenCalled();
      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: null }),
      );
    });

    it('يرفض الإنشاء بلا سياق tenant', async () => {
      requestContext.getPrincipal.mockReturnValue({ tenantId: undefined });

      await expect(
        service.createUnit({ name: 'X', orgType: OrgType.BRANCH }),
      ).rejects.toThrow(MissingTenantContextException);
    });
  });

  describe('التغطية الجغرافية', () => {
    it('يرفض موقعاً غير موجود', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);
      queryRepository.findExistingLocationIds.mockResolvedValue(['loc-1']);

      await expect(
        service.setCoverage('unit-1', {
          locationIds: ['loc-1', 'ghost-loc'],
        }),
      ).rejects.toThrow(UnknownCoverageLocationException);

      expect(commandRepository.setCoverage).not.toHaveBeenCalled();
    });

    it('يأخذ tenant_id من الوحدة لا من سياق الطلب', async () => {
      // مدير المنصة قد يعدّل تغطية وحدة لا ينتمي لشركتها
      queryRepository.findById.mockResolvedValue(foreignUnit);
      queryRepository.findExistingLocationIds.mockResolvedValue(['loc-1']);

      await service.setCoverage('unit-9', { locationIds: ['loc-1'] });

      expect(commandRepository.setCoverage).toHaveBeenCalledWith(
        'unit-9',
        OTHER_TENANT_ID,
        ['loc-1'],
      );
    });

    it('يقبل قائمة فارغة كإزالة كاملة للتغطية', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);

      await service.setCoverage('unit-1', { locationIds: [] });

      expect(commandRepository.setCoverage).toHaveBeenCalledWith(
        'unit-1',
        TENANT_ID,
        [],
      );
    });
  });

  describe('deleteUnit', () => {
    it('يمنع الحذف عند وجود وحدات فرعية', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);
      queryRepository.countChildren.mockResolvedValue(4);

      await expect(service.deleteUnit('unit-1')).rejects.toThrow(
        OrganizationUnitHasChildrenException,
      );
      expect(commandRepository.delete).not.toHaveBeenCalled();
    });

    it('يمنع الحذف عند وجود تعيينات موظفين فعّالة', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);
      queryRepository.countActiveAssignments.mockResolvedValue(7);

      await expect(service.deleteUnit('unit-1')).rejects.toThrow(
        OrganizationUnitInUseException,
      );
      expect(commandRepository.delete).not.toHaveBeenCalled();
    });

    it('يحذف عند خلوّها', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);

      await service.deleteUnit('unit-1');

      expect(commandRepository.delete).toHaveBeenCalledWith('unit-1');
    });
  });

  describe('updateUnit', () => {
    it('يرمي NotFound عند الغياب', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUnit('missing', { name: 'X' }),
      ).rejects.toThrow(OrganizationUnitNotFoundException);
    });

    it('يمرّر الحقول القابلة للتعديل فقط', async () => {
      queryRepository.findById.mockResolvedValue(ownUnit);

      await service.updateUnit('unit-1', {
        name: 'Renamed',
        isActive: false,
      });

      expect(commandRepository.update).toHaveBeenCalledWith(
        'unit-1',
        expect.objectContaining({ name: 'Renamed', isActive: false }),
      );
    });
  });
});
