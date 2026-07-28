import { GlobalLocationSubject } from '../modules/global-location/authorization/subjects/global-location.subject';
import { PermissionSubject } from '../modules/permission/authorization/subjects/permission.subject';
import { RoleSubject } from '../modules/role/authorization/subjects/role.subject';
import { TenantSubject } from '../modules/tenant/authorization/subjects/tenant.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof PermissionSubject
  | typeof RoleSubject
  | typeof GlobalLocationSubject;
