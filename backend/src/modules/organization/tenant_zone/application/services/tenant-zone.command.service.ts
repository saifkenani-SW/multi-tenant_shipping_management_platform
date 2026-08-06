import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { TenantZoneCommandRepository } from '../../infrastructure/repositories/tenant-zone.command.repository';
import { TenantZoneQueryRepository } from '../../infrastructure/repositories/tenant-zone.query.repository';
import { CreateTenantZoneDto } from '../dtos/requests/create-tenant-zone.dto';
import { UpdateTenantZoneDto } from '../dtos/requests/update-tenant-zone.dto';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_ZONE_CACHE_KEYS } from '../../constants/tenant-zone.cache.constants';

@Injectable()
export class TenantZoneCommandService {
  constructor(
    private readonly commandRepository: TenantZoneCommandRepository,
    private readonly queryRepository: TenantZoneQueryRepository,
  ) {}

  @CacheEvict({
    keyPrefix: TENANT_ZONE_CACHE_KEYS.PREFIX,
    keyBuilder: (tenantId: string, dto: CreateTenantZoneDto) => [
      TENANT_ZONE_CACHE_KEYS.LIST,
      tenantId,
    ],
  })
  @Transactional()
  async create(tenantId: string, dto: CreateTenantZoneDto) {
    const { id } = await this.commandRepository.create(tenantId, dto);
    return { id };
  }

  // مسح كاش التفاصيل لضمان تحديث بيانات المنطقة
  @CacheEvict({
    keyPrefix: TENANT_ZONE_CACHE_KEYS.PREFIX,
    keyBuilder: (tenantId: string, id: string, dto: UpdateTenantZoneDto) => [
      TENANT_ZONE_CACHE_KEYS.DETAILS,
      id,
    ],
  })
  // مسح كاش القائمة لضمان تحديث اللائحة العامة
  @CacheEvict({
    keyPrefix: TENANT_ZONE_CACHE_KEYS.PREFIX,
    keyBuilder: (tenantId: string, id: string, dto: UpdateTenantZoneDto) => [
      TENANT_ZONE_CACHE_KEYS.LIST,
      tenantId,
    ],
  })
  @Transactional()
  async update(tenantId: string, id: string, dto: UpdateTenantZoneDto) {
    const existing = await this.queryRepository.findById(id);
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(
        'Tenant zone not found or belongs to another tenant.',
      );
    }

    await this.commandRepository.update(id, dto);
    return { id };
  }
}
