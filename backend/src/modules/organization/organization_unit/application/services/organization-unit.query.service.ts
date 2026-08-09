import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationUnitQueryRepository } from '../../infrastructure/repositories/organization-unit.query.repository';
import { OrganizationUnitQueryDto } from '../dtos/requests/organization-unit-query.dto';
import { OrganizationUnitResponseDto } from '../dtos/responses/organization-unit.response.dto';
import { ResolvedTenantCandidatesDto } from '../dtos/responses/resolved-tenant-candidates.dto';

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

  /**
   * Returns the full DTO for each ID.
   *
   * The repo's findByIds is decorated with CacheStrategy.MANY which returns
   * Map<string, OrganizationUnitResponseDto> at runtime. We normalize it here
   * so callers always receive a plain array with the same shape as findById.
   */
  async findByIds(ids: string[], activeOnly: boolean = false): Promise<OrganizationUnitResponseDto[]> {
    if (!ids || ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const result = await this.queryRepository.findByIds(uniqueIds);
    let records = result instanceof Map ? Array.from(result.values()) : result;

    if (activeOnly) {
      records = records.filter(r => r.isActive);
    }
    return records;
  }

  /**
   * Validates that all provided IDs exist and belong to the given tenant.
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

  async findCandidatesByGlobalLocation(locationId: string) {
    return this.queryRepository.findCandidatesByGlobalLocation(locationId);
  }

  /**
   * Resolves tenant candidates that can cover both the origin and destination locations.
   * Groups org units by tenantId, then filters to only tenants that have at least
   * one candidate on each side.
   */
  async resolveRoutesForLocations(
    originLocationId: string,
    destinationLocationId: string,
    targetTenantId?: string,
  ): Promise<ResolvedTenantCandidatesDto[]> {
    const [originRecords, destinationRecords] = await Promise.all([
      this.queryRepository.findCandidatesByGlobalLocation(
        originLocationId,
        targetTenantId,
      ),
      this.queryRepository.findCandidatesByGlobalLocation(
        destinationLocationId,
        targetTenantId,
      ),
    ]);

    const tenantMap = new Map<string, ResolvedTenantCandidatesDto>();

    for (const record of originRecords) {
      if (!tenantMap.has(record.tenantId)) {
        tenantMap.set(record.tenantId, {
          tenantId: record.tenantId,
          tenantName: record.tenantName,
          originCandidates: [],
          destinationCandidates: [],
        });
      }
      tenantMap.get(record.tenantId)!.originCandidates.push({
        orgUnitId: record.orgUnitId,
        orgUnitName: record.orgUnitName,
        zoneId: record.zoneId,
        zoneName: record.zoneName,
      });
    }

    for (const record of destinationRecords) {
      if (!tenantMap.has(record.tenantId)) {
        tenantMap.set(record.tenantId, {
          tenantId: record.tenantId,
          tenantName: record.tenantName,
          originCandidates: [],
          destinationCandidates: [],
        });
      }
      tenantMap.get(record.tenantId)!.destinationCandidates.push({
        orgUnitId: record.orgUnitId,
        orgUnitName: record.orgUnitName,
        zoneId: record.zoneId,
        zoneName: record.zoneName,
      });
    }

    return Array.from(tenantMap.values()).filter(
      (route) =>
        route.originCandidates.length > 0 &&
        route.destinationCandidates.length > 0,
    );
  }
}
