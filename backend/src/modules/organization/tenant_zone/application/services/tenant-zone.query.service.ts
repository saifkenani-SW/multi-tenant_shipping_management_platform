import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantZoneQueryRepository } from '../../infrastructure/repositories/tenant-zone.query.repository';
import { TenantZoneQueryDto } from '../dtos/requests/tenant-zone-query.dto';
import { TenantZoneResponseDto } from '../dtos/responses/tenant-zone.response.dto';

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

  /**
   * Returns the full DTO for each ID.
   *
   * The repo's findByIds is decorated with CacheStrategy.MANY which returns
   * Map<string, TenantZoneResponseDto> at runtime. We normalize it here
   * so callers always receive a plain array with the same shape as findById.
   */
  async findByIds(ids: string[]): Promise<TenantZoneResponseDto[]> {
    if (!ids || ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const result = await this.queryRepository.findByIds(uniqueIds);
    return result instanceof Map ? Array.from(result.values()) : result;
  }

  /**
   * Validates that all provided zone IDs exist and belong to the given tenant.
   *
   * Delegates to findByIds (DETAILS cache pool — shared with findById) so any
   * prior lookup of these IDs from any context becomes a cache hit here.
   * The tenant ownership check is done against the returned DTOs.
   */
  async validateAllBelongToTenant(
    tenantId: string,
    ids: string[],
  ): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    const uniqueIds = [...new Set(ids)];

    const records = await this.findByIds(uniqueIds);

    if (records.length !== uniqueIds.length) return false;

    return records.every((r) => r.tenantId === tenantId);
  }
}
