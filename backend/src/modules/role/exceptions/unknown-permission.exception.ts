import { BadRequestException } from '@nestjs/common';

/**
 * يمنع ربط دور بصلاحية غير موجودة في الكتالوج — وإلا صار الدور يحمل
 * امتيازاً لا يقابله فحص في الكود.
 */
export class UnknownPermissionException extends BadRequestException {
  constructor(permissionIds: readonly string[]) {
    super(`Unknown permission id(s): ${permissionIds.join(', ')}`);
  }
}
