import { ConflictException } from '@nestjs/common';

/** يقابل uq_tenant_emp_code: الرمز فريد داخل الشركة لا عبر المنصة. */
export class DuplicateEmployeeCodeException extends ConflictException {
  constructor(employeeCode: string) {
    super(`Employee code "${employeeCode}" is already used in this tenant`);
  }
}
