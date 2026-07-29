import { CreateOrganizationUnitDto } from '../../../dtos/requests/create-organization-unit.dto';
import { SetCoverageDto } from '../../../dtos/requests/set-coverage.dto';
import { UpdateOrganizationUnitDto } from '../../../dtos/requests/update-organization-unit.dto';

export interface CreateOrganizationUnitPayload {
  dto: CreateOrganizationUnitDto;
}

export interface ViewOrganizationUnitPayload {
  unitId?: string;
}

export interface UpdateOrganizationUnitPayload {
  unitId: string;
  dto: UpdateOrganizationUnitDto;
}

export interface DeleteOrganizationUnitPayload {
  unitId: string;
}

export interface ManageCoveragePayload {
  unitId: string;
  dto: SetCoverageDto;
}
