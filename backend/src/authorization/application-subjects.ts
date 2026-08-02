import { EmployeeSubject } from '../modules/employee/authorization/subjects/employee.subject';
import { GlobalLocationSubject } from '../modules/global-location/authorization/subjects/global-location.subject';
import { OrganizationUnitSubject } from '../modules/organization-unit/authorization/subjects/organization-unit.subject';
import { TenantSubject } from '../modules/tenant/domain/authorization/subjects/tenant.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof GlobalLocationSubject
  | typeof OrganizationUnitSubject
  | typeof EmployeeSubject;
