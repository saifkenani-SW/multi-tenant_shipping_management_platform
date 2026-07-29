import { BadRequestException } from '@nestjs/common';

/**
 * كل دور يخص tenant واحداً. مدير المنصة لا يحمل tenantId في سياق
 * الطلب، فإنشاء دور منه يحتاج مساراً يحدد الـ tenant صراحة.
 */
export class MissingTenantContextException extends BadRequestException {
  constructor() {
    super('A tenant context is required to create a role');
  }
}
