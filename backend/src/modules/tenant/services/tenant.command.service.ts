import { Inject, Injectable } from '@nestjs/common';
import type { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { ITenantCommandService } from '../interfaces/tenant.command.service.interface';
import { CreateTenantDto } from '../dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/requests/update-tenant.dto';
import { TenantStatus } from '../enums/tenant-status.enum';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_CACHE_KEYS } from '../constants/tenant.cache.constants';
import { TenantAction, TenantPolicy } from '../authorization';
import { Authorize } from '../../../packages/authorization';
import { TENANT_COMMAND_REPOSITORY_TOKEN } from '../tokens/tenant-repository.tokens';
import { Policy } from '../../../packages/authorization/policy';
import { TenantNotFoundException } from '../exceptions/tenant-not-found.exception';

@Injectable()
export class TenantCommandService implements ITenantCommandService {
  constructor(
    @Inject(TENANT_COMMAND_REPOSITORY_TOKEN)
    private readonly tenantRepository: ITenantCommandRepository,
  ) {}

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Create),
    payloadResolver: (dto: CreateTenantDto) => ({
      dto,
    }),
  })
  async createTenant(dto: CreateTenantDto): Promise<string> {
    const tenant = await this.tenantRepository.create({
      name: dto.name,
      taxNumber: dto.taxNumber,
      email: dto.email,
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
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (tenantId: string, dto: UpdateTenantDto) => ({
      tenantId,
      dto,
    }),
  })
  async updateTenant(id: string, dto: UpdateTenantDto): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    await this.tenantRepository.update(id, {
      name: dto.name,
      taxNumber: dto.taxNumber,
      email: dto.email,
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
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Suspend),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async suspendTenant(id: string, reason?: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
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
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Activate),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async activateTenant(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }
    await this.tenantRepository.updateStatus(id, TenantStatus.ACTIVE);
  }
}
