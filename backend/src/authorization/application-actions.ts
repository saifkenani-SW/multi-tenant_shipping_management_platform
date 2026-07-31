import { EmployeeAction } from '../modules/employee/authorization/actions/employee.action';
import { GlobalLocationAction } from '../modules/global-location/authorization/actions/global-location.action';
import { OrganizationUnitAction } from '../modules/organization-unit/authorization/actions/organization-unit.action';
import { PermissionAction } from '../modules/authorization/casl/actions/permission.action';
import { RoleAction } from '../modules/authorization/casl/actions/role.action';
import { TenantAction } from '../modules/tenant/domain/authorization';

export type ApplicationActions =
  | TenantAction
  | PermissionAction
  | RoleAction
  | GlobalLocationAction
  | OrganizationUnitAction
  | EmployeeAction;
