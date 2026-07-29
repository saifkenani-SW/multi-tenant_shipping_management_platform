import { CreateOrganizationUnitDto } from '../dtos/requests/create-organization-unit.dto';
import { SetCoverageDto } from '../dtos/requests/set-coverage.dto';
import { UpdateOrganizationUnitDto } from '../dtos/requests/update-organization-unit.dto';

export interface IOrganizationUnitCommandService {
  createUnit(dto: CreateOrganizationUnitDto): Promise<string>;
  updateUnit(id: string, dto: UpdateOrganizationUnitDto): Promise<void>;
  deleteUnit(id: string): Promise<void>;
  setCoverage(id: string, dto: SetCoverageDto): Promise<void>;
}
