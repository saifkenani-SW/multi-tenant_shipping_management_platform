import { EmployeeAction } from '../modules/employee/authorization/actions/employee.action';
import { GlobalLocationAction } from '../modules/global-location/authorization/actions/global-location.action';
import { OrganizationUnitAction } from '../modules/organization-unit/authorization/actions/organization-unit.action';
import { PermissionAction } from '../modules/authorization/domain/enums/permission.enum';
import { TenantAction } from '../modules/tenant/domain/authorization';

export type ApplicationActions =
  | TenantAction
  | PermissionAction
  | GlobalLocationAction
  | OrganizationUnitAction
  | EmployeeAction;
