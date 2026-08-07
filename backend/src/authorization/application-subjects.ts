import { EmployeeSubject } from '../modules/employee/authorization/subjects/employee.subject';
import { TenantSubject } from '../modules/tenant/domain/authorization/subjects/tenant.subject';

export type ApplicationSubjects = typeof TenantSubject | typeof EmployeeSubject;
