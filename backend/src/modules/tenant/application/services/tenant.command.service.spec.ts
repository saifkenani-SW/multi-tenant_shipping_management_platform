import { Test, TestingModule } from '@nestjs/testing';
import { TenantCommandService } from './tenant.command.service';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { CACHE_PROVIDER } from '../../../../core/cache/tokens/cache.tokens';
import { CacheContainer } from '../../../../infrastructure/cache/container/CacheContainer';
import { CacheFacade } from '../../../../infrastructure/cache/facade/CacheFacade';
import { CacheKeyBuilder } from '../../../../infrastructure/cache/builders/CacheKeyBuilder';
import { TenantCommandRepository } from '../../infrastructure/repositories/tenant.command.repository';
import { TenantSettingsCommandRepository } from '../../infrastructure/repositories/tenant-settings.command.repository';
import { UserFacade } from '../../../user/application/facades/user.facade';
import { TransactionContainer } from '../../../../packages/transaction';
import { AuthorizationContainer } from '../../../../packages/authorization/authorization.container';
import { TenantNotFoundException } from '../../domain/exceptions/tenant-not-found.exception';
import { TenantAction } from '../../domain/authorization';
import { SUBSCRIPTION_PLAN_QUERY_SERVICE } from '../../../subscription-plan/tokens/subscription-plan-service.tokens';

describe('TenantCommandService', () => {
  let service: TenantCommandService;
  let tenantRepository: any;
  let settingsCommandRepository: any;
  let cacheProvider: any;
  let authorizationFacade: any;
  let userFacade: any;
  let planQueryService: any;

  beforeEach(async () => {
    tenantRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    settingsCommandRepository = {
      upsertDeliverySettings: jest.fn(),
      upsertOperationalSettings: jest.fn(),
      upsertPricingSettings: jest.fn(),
      assignOwner: jest.fn(),
    };

    userFacade = {
      existsAndActive: jest.fn().mockResolvedValue(true),
    };

    planQueryService = {
      getPlanDetails: jest.fn(),
    };

    cacheProvider = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    authorizationFacade = {
      authorize: jest.fn().mockResolvedValue(undefined),
    };

    const cacheFacade = new CacheFacade(cacheProvider, new CacheKeyBuilder());
    jest.spyOn(CacheContainer, 'get').mockReturnValue(cacheFacade);
    jest
      .spyOn(AuthorizationContainer, 'get')
      .mockReturnValue(authorizationFacade);
    jest.spyOn(TransactionContainer, 'get').mockReturnValue({
      execute: jest.fn(async (fn) => fn({})),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantCommandService,
        {
          provide: TenantCommandRepository,
          useValue: tenantRepository,
        },
        {
          provide: TenantSettingsCommandRepository,
          useValue: settingsCommandRepository,
        },
        {
          provide: UserFacade,
          useValue: userFacade,
        },
        {
          provide: SUBSCRIPTION_PLAN_QUERY_SERVICE,
          useValue: planQueryService,
        },
        { provide: CACHE_PROVIDER, useValue: cacheProvider },
      ],
    }).compile();

    service = module.get<TenantCommandService>(TenantCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createTenant', () => {
    it('should create a tenant and evict cache pattern', async () => {
      const dto = {
        name: 'Test Tenant',
        taxNumber: '123',
        email: 'test@example.com',
        phone: '1234567890',
        ownerUserId: 'owner-uuid-1',
      };
      tenantRepository.create.mockResolvedValue({ id: 'tenant-uuid-1' });

      const result = await service.createTenant(dto);

      expect(userFacade.existsAndActive).toHaveBeenCalledWith(dto.ownerUserId);

      expect(tenantRepository.create).toHaveBeenCalledWith({
        name: dto.name,
        taxNumber: dto.taxNumber,
        email: dto.email,
        phone: dto.phone,
        logoUrl: null,
      });

      expect(
        settingsCommandRepository.upsertDeliverySettings,
      ).toHaveBeenCalled();
      expect(
        settingsCommandRepository.upsertOperationalSettings,
      ).toHaveBeenCalled();
      expect(
        settingsCommandRepository.upsertPricingSettings,
      ).toHaveBeenCalled();
      expect(settingsCommandRepository.assignOwner).toHaveBeenCalledWith(
        'tenant-uuid-1',
        'owner-uuid-1',
        true,
      );

      expect(result).toEqual('tenant-uuid-1');
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:list:*');
    });

    it('should bubble up repository errors (e.g., P2002)', async () => {
      const dto = {
        name: 'Test Tenant',
        taxNumber: '123',
        email: 'test@example.com',
        phone: '1234567890',
        ownerUserId: 'owner-uuid-1',
      };
      const prismaError = { code: 'P2002' };
      tenantRepository.create.mockRejectedValue(prismaError);

      await expect(service.createTenant(dto)).rejects.toEqual(prismaError);
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if userFacade returns false', async () => {
      userFacade.existsAndActive.mockResolvedValue(false);
      const dto = {
        name: 'Test Tenant',
        taxNumber: '123',
        email: 'test@example.com',
        phone: '1234567890',
        ownerUserId: 'invalid-user',
      };

      await expect(service.createTenant(dto)).rejects.toThrow(
        'Owner user must exist and be active',
      );
      expect(tenantRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateTenant', () => {
    it('should throw TenantNotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateTenant('invalid-id', { name: 'New Name' }),
      ).rejects.toThrow(TenantNotFoundException);
      expect(tenantRepository.update).not.toHaveBeenCalled();
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });

    it('should bubble up repository errors (e.g., P2002)', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'valid-id' });
      const prismaError = { code: 'P2002' };
      tenantRepository.update.mockRejectedValue(prismaError);

      await expect(
        service.updateTenant('valid-id', { name: 'New Name' }),
      ).rejects.toEqual(prismaError);
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });

    it('should update tenant and evict cache', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'valid-id' });
      tenantRepository.update.mockResolvedValue(undefined);

      await service.updateTenant('valid-id', { name: 'New Name' });

      expect(tenantRepository.update).toHaveBeenCalledWith('valid-id', {
        name: 'New Name',
      });
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:list:*');
      expect(cacheProvider.del).toHaveBeenCalledWith('tenant:details:valid-id');
    });
  });

  describe('suspendTenant', () => {
    it('should throw TenantNotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(
        service.suspendTenant('invalid-id', 'Fraud'),
      ).rejects.toThrow(TenantNotFoundException);
      expect(tenantRepository.updateStatus).not.toHaveBeenCalled();

      // CacheEvict only runs if the method completes successfully, so delByPattern should not be called
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });

    it('should suspend tenant and evict cache pattern', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'valid-id' });
      tenantRepository.updateStatus.mockResolvedValue(undefined);

      await service.suspendTenant('valid-id', 'Fraud');

      expect(tenantRepository.findById).toHaveBeenCalledWith('valid-id');
      expect(tenantRepository.updateStatus).toHaveBeenCalledWith(
        'valid-id',
        TenantStatus.SUSPENDED,
        'Fraud',
      );
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:list:*');
      expect(cacheProvider.del).toHaveBeenCalledWith('tenant:details:valid-id');
      expect(authorizationFacade.authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          policy: expect.objectContaining({ action: TenantAction.Suspend }),
        }),
        { tenantId: 'valid-id' },
      );
    });
  });

  describe('activateTenant', () => {
    it('should throw TenantNotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.activateTenant('invalid-id')).rejects.toThrow(
        TenantNotFoundException,
      );
      expect(tenantRepository.updateStatus).not.toHaveBeenCalled();

      // CacheEvict only runs if the method completes successfully
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });

    it('should activate tenant and evict cache pattern', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'valid-id' });
      tenantRepository.updateStatus.mockResolvedValue(undefined);

      await service.activateTenant('valid-id');

      expect(tenantRepository.findById).toHaveBeenCalledWith('valid-id');
      expect(tenantRepository.updateStatus).toHaveBeenCalledWith(
        'valid-id',
        TenantStatus.ACTIVE,
      );
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:list:*');
      expect(cacheProvider.del).toHaveBeenCalledWith('tenant:details:valid-id');
      expect(authorizationFacade.authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          policy: expect.objectContaining({ action: TenantAction.Activate }),
        }),
        { tenantId: 'valid-id' },
      );
    });
  });
});
