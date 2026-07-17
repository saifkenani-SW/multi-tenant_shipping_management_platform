import { Test, TestingModule } from '@nestjs/testing';
import { TenantCommandService } from './tenant.command.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TenantStatus } from '../enums/tenant-status.enum';

describe('TenantCommandService', () => {
  let service: TenantCommandService;
  let tenantRepository: any;
  let cacheProvider: any;

  beforeEach(async () => {
    tenantRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    cacheProvider = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantCommandService,
        { provide: 'ITenantCommandRepository', useValue: tenantRepository },
        { provide: 'ICacheProvider', useValue: cacheProvider },
      ],
    }).compile();

    service = module.get<TenantCommandService>(TenantCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a tenant and evict cache pattern', async () => {
      const dto = {
        name: 'Test Tenant',
        taxNumber: '123',
        contactEmail: 'test@example.com',
      };
      tenantRepository.create.mockResolvedValue({ id: 'tenant-uuid-1' });

      const result = await service.createTenant(dto);

      expect(tenantRepository.create).toHaveBeenCalledWith({
        name: dto.name,
        taxNumber: dto.taxNumber,
        contactEmail: dto.contactEmail,
      });
      expect(result).toEqual('tenant-uuid-1');
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:*');
    });

    it('should bubble up repository errors (e.g., P2002)', async () => {
      const dto = {
        name: 'Test Tenant',
        taxNumber: '123',
        contactEmail: 'test@example.com',
      };
      const prismaError = { code: 'P2002' };
      tenantRepository.create.mockRejectedValue(prismaError);

      await expect(service.createTenant(dto)).rejects.toEqual(prismaError);
      expect(cacheProvider.delByPattern).not.toHaveBeenCalled();
    });
  });

  describe('updateTenant', () => {
    it('should throw NotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateTenant('invalid-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
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
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:*');
    });
  });

  describe('suspendTenant', () => {
    it('should throw NotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(
        service.suspendTenant('invalid-id', 'Fraud'),
      ).rejects.toThrow(NotFoundException);
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
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:*');
    });
  });

  describe('activateTenant', () => {
    it('should throw NotFoundException if tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.activateTenant('invalid-id')).rejects.toThrow(
        NotFoundException,
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
      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('tenant:*');
    });
  });
});
