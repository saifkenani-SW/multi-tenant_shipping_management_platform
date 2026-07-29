import { BadRequestException } from '@nestjs/common';

/**
 * تعيين موظف على وحدة أو منحه دوراً من شركة أخرى يمنحه صلاحيات خارج
 * شركته. المفاتيح الأجنبية لا تقارن tenant_id، فالفحص هنا إلزامي.
 */
export class CrossTenantAssignmentException extends BadRequestException {
  constructor(what: 'organization unit' | 'role') {
    super(`The given ${what} belongs to a different tenant`);
  }
}
