import { TenantAction } from '../modules/tenant/domain/authorization';
import { PermissionAction } from '../modules/authorization';
import { EmployeeAction } from '../modules/employee/authorization';

export type ApplicationActions =
  | TenantAction
  | PermissionAction
  | EmployeeAction;
