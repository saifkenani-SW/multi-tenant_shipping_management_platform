import { ForbiddenException, Injectable } from '@nestjs/common';

import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { OrgType } from '../../../organization/organization_unit/domain/enums/org-type.enum';
import {
  OrganizationUnitStatisticsQueryRepository,
  OrgUnitStatsRow,
  OrgUnitStatsScopeFilter,
} from '../../infrastructure/repositories/organization-unit-statistics.query.repository';
import { OrganizationUnitStatsQueryDto } from '../dtos/requests/organization-unit-stats-query.dto';
import {
  CompanyOrgUnitStatsDto,
  OrganizationUnitStatisticsResponseDto,
  OrganizationUnitStatisticsTotalsDto,
  OrgUnitRelatedCountsDto,
  OrgUnitStatsRowDto,
  OrgUnitStatsScope,
  OrgUnitTypeBucketDto,
} from '../dtos/responses/organization-unit-statistics.response.dto';

const EMPTY_COUNTS: OrgUnitRelatedCountsDto = {
  employees: 0,
  parcelsCurrent: 0,
  parcelsIncoming: 0,
  shipmentsOrigin: 0,
  shipmentsDestination: 0,
  tripsOrigin: 0,
  tripsDestination: 0,
  manifestsOrigin: 0,
  manifestsDestination: 0,
  invoicesOrigin: 0,
  invoicesDestination: 0,
  quotationsOrigin: 0,
  quotationsDestination: 0,
  coverageLocations: 0,
};

@Injectable()
export class OrganizationUnitStatisticsService {
  constructor(
    private readonly repository: OrganizationUnitStatisticsQueryRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * One dashboard, read differently by each caller.
   *
   * Companies are never mixed: every figure sits under the company it
   * belongs to. What the caller may see comes from the request context,
   * never from the request, so no count is computed over units outside
   * their reach.
   */
  async getOrganizationUnitStatistics(
    query: OrganizationUnitStatsQueryDto,
  ): Promise<OrganizationUnitStatisticsResponseDto> {
    const { filter, scope, includeUnits } = this.resolveScope(query);
    const rows = await this.repository.listUnits(filter);

    return this.assemble(scope, rows, includeUnits);
  }

  private assemble(
    scope: OrgUnitStatsScope,
    rows: OrgUnitStatsRow[],
    includeUnits: boolean,
  ): OrganizationUnitStatisticsResponseDto {
    const companies = this.groupByCompany(rows, includeUnits);

    return {
      scope,
      totals: this.toTotals(rows),
      companies,
    };
  }

  private groupByCompany(
    rows: OrgUnitStatsRow[],
    includeUnits: boolean,
  ): CompanyOrgUnitStatsDto[] {
    const byTenant = new Map<string, OrgUnitStatsRow[]>();

    for (const row of rows) {
      const list = byTenant.get(row.tenantId) ?? [];
      list.push(row);
      byTenant.set(row.tenantId, list);
    }

    return Array.from(byTenant.entries()).map(([tenantId, units]) => {
      const totals = this.toTotals(units);

      return {
        tenantId,
        tenantName: units[0]?.tenantName ?? null,
        ...totals,
        ...(includeUnits ? { branches: units.map(this.toUnitRow) } : {}),
      };
    });
  }

  private toTotals(rows: OrgUnitStatsRow[]): OrganizationUnitStatisticsTotalsDto {
    const byType = this.byType(rows);

    return {
      units: rows.length,
      active: rows.filter((row) => row.isActive).length,
      inactive: rows.filter((row) => !row.isActive).length,
      byType,
      ...this.sumCounts(rows),
    };
  }

  private byType(rows: OrgUnitStatsRow[]): OrgUnitTypeBucketDto[] {
    const buckets = new Map<OrgType, OrgUnitTypeBucketDto>();

    for (const row of rows) {
      const bucket = buckets.get(row.type) ?? {
        type: row.type,
        total: 0,
        active: 0,
      };
      bucket.total += 1;
      if (row.isActive) bucket.active += 1;
      buckets.set(row.type, bucket);
    }

    return Array.from(buckets.values()).sort((a, b) =>
      a.type.localeCompare(b.type),
    );
  }

  private sumCounts(rows: OrgUnitStatsRow[]): OrgUnitRelatedCountsDto {
    return rows.reduce(
      (sum, row) => ({
        employees: sum.employees + row.employees,
        parcelsCurrent: sum.parcelsCurrent + row.parcelsCurrent,
        parcelsIncoming: sum.parcelsIncoming + row.parcelsIncoming,
        shipmentsOrigin: sum.shipmentsOrigin + row.shipmentsOrigin,
        shipmentsDestination:
          sum.shipmentsDestination + row.shipmentsDestination,
        tripsOrigin: sum.tripsOrigin + row.tripsOrigin,
        tripsDestination: sum.tripsDestination + row.tripsDestination,
        manifestsOrigin: sum.manifestsOrigin + row.manifestsOrigin,
        manifestsDestination:
          sum.manifestsDestination + row.manifestsDestination,
        invoicesOrigin: sum.invoicesOrigin + row.invoicesOrigin,
        invoicesDestination: sum.invoicesDestination + row.invoicesDestination,
        quotationsOrigin: sum.quotationsOrigin + row.quotationsOrigin,
        quotationsDestination:
          sum.quotationsDestination + row.quotationsDestination,
        coverageLocations: sum.coverageLocations + row.coverageLocations,
      }),
      { ...EMPTY_COUNTS },
    );
  }

  private toUnitRow(row: OrgUnitStatsRow): OrgUnitStatsRowDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      isActive: row.isActive,
      employees: row.employees,
      parcelsCurrent: row.parcelsCurrent,
      parcelsIncoming: row.parcelsIncoming,
      shipmentsOrigin: row.shipmentsOrigin,
      shipmentsDestination: row.shipmentsDestination,
      tripsOrigin: row.tripsOrigin,
      tripsDestination: row.tripsDestination,
      manifestsOrigin: row.manifestsOrigin,
      manifestsDestination: row.manifestsDestination,
      invoicesOrigin: row.invoicesOrigin,
      invoicesDestination: row.invoicesDestination,
      quotationsOrigin: row.quotationsOrigin,
      quotationsDestination: row.quotationsDestination,
      coverageLocations: row.coverageLocations,
    };
  }

  /**
   * Who is asking, and how much they may see.
   *
   * A tenant admin naming another company is refused rather than quietly
   * given their own: silently narrowing what was asked for would let them
   * read an empty dashboard as an empty company.
   */
  private resolveScope(query: OrganizationUnitStatsQueryDto): {
    filter: OrgUnitStatsScopeFilter;
    scope: OrgUnitStatsScope;
    includeUnits: boolean;
  } {
    const principal = this.requestContext.getPrincipal();
    const branchIds = principal.branches.map((branch) => branch.id);

    switch (principal.subject.type) {
      case SubjectType.PLATFORM_OWNER:
        return {
          scope: OrgUnitStatsScope.PLATFORM_OWNER,
          includeUnits: Boolean(query.tenantId),
          filter: {
            tenantId: query.tenantId ?? null,
            orgUnitIds: null,
          },
        };

      case SubjectType.TENANT_ADMIN: {
        const tenantId = this.requireTenant(principal.tenantId, query.tenantId);
        return {
          scope: OrgUnitStatsScope.TENANT_ADMIN,
          includeUnits: true,
          filter: {
            tenantId,
            orgUnitIds: null,
          },
        };
      }

      case SubjectType.EMPLOYEE: {
        const tenantId = this.requireTenant(principal.tenantId, query.tenantId);
        return {
          scope: OrgUnitStatsScope.EMPLOYEE,
          includeUnits: true,
          filter: {
            tenantId,
            orgUnitIds: branchIds,
          },
        };
      }

      default:
        throw new ForbiddenException(
          'This account cannot read organization unit statistics.',
        );
    }
  }

  private requireTenant(
    callerTenantId: string | undefined,
    requestedTenantId: string | undefined,
  ): string {
    if (!callerTenantId) {
      throw new ForbiddenException(
        'This account is not attached to a workspace.',
      );
    }

    if (requestedTenantId && requestedTenantId !== callerTenantId) {
      throw new ForbiddenException(
        'You can only read statistics for your own company.',
      );
    }

    return callerTenantId;
  }
}
