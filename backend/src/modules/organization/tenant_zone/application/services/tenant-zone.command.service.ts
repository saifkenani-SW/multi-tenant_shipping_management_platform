import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { TenantZoneCommandRepository } from '../../infrastructure/repositories/tenant-zone.command.repository';
import { TenantZoneQueryService } from './tenant-zone.query.service';
import { CreateTenantZoneDto } from '../dtos/requests/create-tenant-zone.dto';
import { UpdateTenantZoneDto } from '../dtos/requests/update-tenant-zone.dto';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_ZONE_CACHE_KEYS } from '../../constants/tenant-zone.cache.constants';

@Injectable()
export class TenantZoneCommandService {
  constructor(
    private readonly commandRepository: TenantZoneCommandRepository,
    private readonly queryService: TenantZoneQueryService,
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
  @CacheEvict({ keyPrefix: TENANT_ZONE_CACHE_KEYS.PREFIX, allEntries: true })
  @Transactional()
  async update(tenantId: string, id: string, dto: UpdateTenantZoneDto) {
    await this.queryService.findById(id, tenantId);

    await this.commandRepository.update(id, dto);
    return { id };
  }
}
