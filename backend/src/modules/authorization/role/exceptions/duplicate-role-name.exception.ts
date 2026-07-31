import { ConflictException } from '@nestjs/common';

/**
 * يقابل القيد uq_tenant_role_name: الاسم فريد داخل الـ tenant الواحد
 * لا على مستوى المنصة.
 */
export class DuplicateRoleNameException extends ConflictException {
  constructor(name: string) {
    super(`A role named "${name}" already exists for this tenant`);
  }
}
