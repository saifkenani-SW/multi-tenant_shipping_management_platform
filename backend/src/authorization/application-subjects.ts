import { EmployeeSubject } from '../modules/employee/authorization/subjects/employee.subject';
import { GlobalLocationSubject } from '../modules/global-location/authorization/subjects/global-location.subject';
import { OrganizationUnitSubject } from '../modules/organization-unit/authorization/subjects/organization-unit.subject';
import { PermissionSubject } from '../modules/authorization/casl/subjects/permission.subject';
import { RoleSubject } from '../modules/authorization/casl/subjects/role.subject';
import { TenantSubject } from '../modules/tenant/domain/authorization/subjects/tenant.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof PermissionSubject
  | typeof RoleSubject
  | typeof GlobalLocationSubject
  | typeof OrganizationUnitSubject
  | typeof EmployeeSubject;
