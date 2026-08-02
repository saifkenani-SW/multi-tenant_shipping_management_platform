import { BadRequestException } from '@nestjs/common';

export class MissingTenantContextException extends BadRequestException {
  constructor() {
    super('Tenant context is required to perform this action');
  }
}
