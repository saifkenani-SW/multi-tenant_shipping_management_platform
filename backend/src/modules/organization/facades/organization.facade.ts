import { Injectable } from '@nestjs/common';
import { OrganizationUnitQueryRepository } from '../organization_unit/infrastructure/repositories/organization-unit.query.repository';
import { OrganizationUnitResponseDto } from '../organization_unit/application/dtos/responses/organization-unit.response.dto';

@Injectable()
export class OrganizationFacade {
  constructor(
    private readonly queryRepository: OrganizationUnitQueryRepository,
  ) {}

  /**
   * Validates if all provided organization unit IDs exist for a given tenant.
   * Returns true if all exist, false otherwise.
   */
  async validateOrganizationUnitsExist(
    tenantId: string,
    orgUnitIds: string[],
  ): Promise<boolean> {
    if (!orgUnitIds || orgUnitIds.length === 0) return true;

    const uniqueIds = Array.from(new Set(orgUnitIds));
    const results = await Promise.all(
      uniqueIds.map((id) => this.queryRepository.findById(id)),
    );

    const validUnits = results.filter(
      (unit) => unit !== null && unit.tenantId === tenantId,
    );
    return validUnits.length === uniqueIds.length;
  }

  /**
   * Fetches multiple organization units by their IDs.
   */
  async getOrganizationUnitsByIds(orgUnitIds: string[]): Promise<OrganizationUnitResponseDto[]> {
    if (!orgUnitIds || orgUnitIds.length === 0) return [];
    const uniqueIds = Array.from(new Set(orgUnitIds));
    const mapOrArray: any = await this.queryRepository.findByIds(uniqueIds);
    return mapOrArray instanceof Map ? Array.from(mapOrArray.values()) : mapOrArray;
  }
}
