import { BadRequestException } from '@nestjs/common';

/**
 * كل وحدة تنظيمية تخص شركة واحدة. مدير المنصة لا يحمل tenantId في
 * سياق الطلب، فإنشاء وحدة منه يحتاج مساراً يحدد الشركة صراحة.
 */
export class MissingTenantContextException extends BadRequestException {
  constructor() {
    super('A tenant context is required to create an organization unit');
  }
}
