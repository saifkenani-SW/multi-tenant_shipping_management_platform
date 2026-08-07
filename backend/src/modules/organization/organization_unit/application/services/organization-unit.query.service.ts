import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationUnitQueryRepository } from '../../infrastructure/repositories/organization-unit.query.repository';
import { OrganizationUnitQueryDto } from '../dtos/requests/organization-unit-query.dto';

@Injectable()
export class OrganizationUnitQueryService {
  constructor(
    private readonly queryRepository: OrganizationUnitQueryRepository,
  ) {}

  async findById(id: string, tenantId?: string) {
    const record = await this.queryRepository.findById(id);
    if (!record || (tenantId && record.tenantId !== tenantId)) {
      throw new NotFoundException('Organization unit not found');
    }
    return record;
  }

  async countByType(tenantId: string, orgType: string) {
    return this.queryRepository.countByType(tenantId, orgType);
  }

  async findMany(criteria: OrganizationUnitQueryDto, contextTenantId?: string) {
    const effectiveTenantId = contextTenantId || criteria.tenantId;
    return this.queryRepository.findMany(criteria, effectiveTenantId);
  }
}
