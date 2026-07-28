import { GlobalLocationAction } from '../modules/global-location/authorization/actions/global-location.action';
import { PermissionAction } from '../modules/permission/authorization';
import { RoleAction } from '../modules/role/authorization/actions/role.action';
import { TenantAction } from '../modules/tenant/authorization';

export type ApplicationActions =
  | TenantAction
  | PermissionAction
  | RoleAction
  | GlobalLocationAction;
