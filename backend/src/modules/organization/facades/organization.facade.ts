import { Injectable } from '@nestjs/common';
import { OrganizationUnitQueryService } from '../organization_unit/application/services/organization-unit.query.service';
import { TenantZoneQueryService } from '../tenant_zone/application/services/tenant-zone.query.service';
import { OrganizationUnitResponseDto } from '../organization_unit/application/dtos/responses/organization-unit.response.dto';
import { ResolvedTenantCandidatesDto } from '../organization_unit/application/dtos/responses/resolved-tenant-candidates.dto';

@Injectable()
export class OrganizationFacade {
  constructor(
    private readonly orgUnitQueryService: OrganizationUnitQueryService,
    private readonly tenantZoneQueryService: TenantZoneQueryService,
  ) {}

  /**
   * Validates if all provided organization unit IDs exist and belong to the given tenant.
   */
  async validateOrganizationUnitsExist(
    tenantId: string,
    orgUnitIds: string[],
  ): Promise<boolean> {
    return this.orgUnitQueryService.validateAllBelongToTenant(
      tenantId,
      orgUnitIds,
    );
  }

  /**
   * Validates if all provided tenant zone IDs exist and belong to the given tenant.
   */
  async validateTenantZonesExist(
    tenantId: string,
    zoneIds: string[],
  ): Promise<boolean> {
    return this.tenantZoneQueryService.validateAllBelongToTenant(
      tenantId,
      zoneIds,
    );
  }

  /**
   * Fetches multiple organization units by their IDs.
   */
  async getOrganizationUnitsByIds(
    orgUnitIds: string[],
    activeOnly: boolean = false
  ): Promise<OrganizationUnitResponseDto[]> {
    return this.orgUnitQueryService.findByIds(orgUnitIds, activeOnly);
  }

  /**
   * Resolves routes for a shipment based on origin and destination locations.
   */
  async resolveRoutesForLocations(
    originLocationId: string,
    destinationLocationId: string,
    targetTenantId?: string,
  ): Promise<ResolvedTenantCandidatesDto[]> {
    return this.orgUnitQueryService.resolveRoutesForLocations(
      originLocationId,
      destinationLocationId,
      targetTenantId,
    );
  }
}
