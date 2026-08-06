import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantZoneQueryRepository } from '../../infrastructure/repositories/tenant-zone.query.repository';
import { TenantZoneQueryDto } from '../dtos/requests/tenant-zone-query.dto';

@Injectable()
export class TenantZoneQueryService {
  constructor(private readonly queryRepository: TenantZoneQueryRepository) {}

  async findById(id: string, tenantId?: string) {
    const record = await this.queryRepository.findById(id);
    if (!record || (tenantId && record.tenantId !== tenantId)) {
      throw new NotFoundException('Tenant zone not found');
    }
    return record;
  }

  async findMany(criteria: TenantZoneQueryDto, contextTenantId?: string) {
    const effectiveTenantId = contextTenantId || criteria.tenantId;
    return this.queryRepository.findMany(criteria, effectiveTenantId);
  }
}
