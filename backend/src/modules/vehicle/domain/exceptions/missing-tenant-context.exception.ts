import { BadRequestException } from '@nestjs/common';

export class MissingTenantContextException extends BadRequestException {
  constructor() {
    super('طلب غير صالح - يرجى تمرير معرف المستأجر (x-tenant-id) في الهيدر');
  }
}
