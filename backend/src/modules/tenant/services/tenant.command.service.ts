import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { ITenantCommandService } from '../interfaces/tenant.command.service.interface';
import { CreateTenantDto } from '../dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/requests/update-tenant.dto';
import { TenantStatus } from '../enums/tenant-status.enum';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_CACHE_KEYS } from '../constants/tenant.cache.constants';

@Injectable()
export class TenantCommandService implements ITenantCommandService {
  constructor(
    @Inject('ITenantCommandRepository')
    private readonly tenantRepository: ITenantCommandRepository,
  ) {}

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async createTenant(dto: CreateTenantDto): Promise<string> {
    const tenant = await this.tenantRepository.create({
      name: dto.name,
      taxNumber: dto.taxNumber,
      contactEmail: dto.contactEmail,
    });

    return tenant.id;
  }

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
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

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
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

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
  async activateTenant(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    await this.tenantRepository.updateStatus(id, TenantStatus.ACTIVE);
  }
}
