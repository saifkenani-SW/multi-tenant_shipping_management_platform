import { CreateRoleDto } from '../dtos/requests/create-role.dto';
import { SetRolePermissionsDto } from '../dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from '../dtos/requests/update-role.dto';

export interface IRoleCommandService {
  createRole(dto: CreateRoleDto): Promise<string>;
  updateRole(id: string, dto: UpdateRoleDto): Promise<void>;
  deleteRole(id: string): Promise<void>;
  setRolePermissions(id: string, dto: SetRolePermissionsDto): Promise<void>;
}
