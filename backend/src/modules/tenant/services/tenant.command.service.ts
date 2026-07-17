import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { ITenantCommandService } from '../interfaces/tenant.command.service.interface';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { TenantStatus } from '../enums/tenant-status.enum';
import { CacheEvict } from '../../../core/cache/decorators/CacheEvict';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { TENANT_CACHE_KEYS } from '../constants/tenant.cache.constants';

@Injectable()
export class TenantCommandService implements ITenantCommandService {
  constructor(
    @Inject('ITenantCommandRepository')
    private readonly tenantRepository: ITenantCommandRepository,
    @Inject('ICacheProvider')
    public readonly cacheProvider: ICacheProvider,
  ) {}

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true }) // Clears lists
  async createTenant(dto: CreateTenantDto): Promise<string> {
    return await this.tenantRepository.create({
      name: dto.name,
      taxNumber: dto.taxNumber,
      contactEmail: dto.contactEmail,
    });
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })
  async updateTenant(id: string, dto: UpdateTenantDto): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantRepository.update(id, {
      name: dto.name,
      taxNumber: dto.taxNumber,
      contactEmail: dto.contactEmail,
    });
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true }) // Clears specific tenant and lists
  async suspendTenant(id: string, reason?: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    await this.tenantRepository.updateStatus(
      id,
      TenantStatus.SUSPENDED,
      reason,
    );
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })
  async activateTenant(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    await this.tenantRepository.updateStatus(id, TenantStatus.ACTIVE);
  }
}
