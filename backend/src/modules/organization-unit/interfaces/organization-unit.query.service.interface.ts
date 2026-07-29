import { OrganizationUnitQueryDto } from '../dtos/requests/organization-unit-query.dto';
import { OrganizationUnitDetailsDto } from '../dtos/responses/organization-unit-details.dto';
import { PaginatedOrganizationUnitListDto } from '../dtos/responses/organization-unit-list.dto';

export interface IOrganizationUnitQueryService {
  findUnits(
    query: OrganizationUnitQueryDto,
  ): Promise<PaginatedOrganizationUnitListDto>;
  getUnitDetails(id: string): Promise<OrganizationUnitDetailsDto>;
}
