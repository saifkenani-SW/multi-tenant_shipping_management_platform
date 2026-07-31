import { RoleQueryDto } from '../dtos/requests/role-query.dto';
import { RoleDetailsDto } from '../dtos/responses/role-details.dto';
import { PaginatedRoleListDto } from '../dtos/responses/role-list.dto';

export interface IRoleQueryService {
  findRoles(query: RoleQueryDto): Promise<PaginatedRoleListDto>;
  getRoleDetails(id: string): Promise<RoleDetailsDto>;
}
