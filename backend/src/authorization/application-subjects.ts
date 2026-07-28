import { PermissionSubject } from '../modules/permission/authorization/subjects/permission.subject';
import { TenantSubject } from '../modules/tenant/authorization/subjects/tenant.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof PermissionSubject;
