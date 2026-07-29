import { BadRequestException } from '@nestjs/common';

/**
 * أخطر خطأ في هذا الموديول: أب من شركة أخرى يربط شجرتين ويسرّب
 * بيانات عبر أي استعلام يصعد أو ينزل الشجرة.
 */
export class CrossTenantParentException extends BadRequestException {
  constructor() {
    super('Parent unit belongs to a different tenant');
  }
}
