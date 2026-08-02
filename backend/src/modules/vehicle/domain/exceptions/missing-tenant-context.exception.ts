import { BadRequestException } from '@nestjs/common';

export class MissingTenantContextException extends BadRequestException {
  constructor() {
    super('A tenant context is required to manage vehicles');
  }
}
