import { CreateRoleDto } from '../../../dtos/requests/create-role.dto';
import { SetRolePermissionsDto } from '../../../dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from '../../../dtos/requests/update-role.dto';

export interface CreateRolePayload {
  dto: CreateRoleDto;
}

export interface ViewRolePayload {
  roleId?: string;
}

export interface UpdateRolePayload {
  roleId: string;
  dto: UpdateRoleDto;
}

export interface DeleteRolePayload {
  roleId: string;
}

export interface ManageRolePermissionsPayload {
  roleId: string;
  dto: SetRolePermissionsDto;
}
