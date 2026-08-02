import { SubjectType } from './SubjectType';

export interface Subject {
  id: string;

  type:
    | SubjectType.PLATFORM_ADMIN
    | SubjectType.TENANT_ADMIN
    | SubjectType.EMPLOYEE
    | SubjectType.DRIVER
    | SubjectType.CUSTOMER
    | SubjectType.SERVICE_ACCOUNT;
}
