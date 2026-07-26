import { TenantSubject } from '../modules/tenant/authorization/subjects/tenant.subject';

export type ApplicationSubjects =
  typeof TenantSubject; /*| typeof CustomerSubject*/
