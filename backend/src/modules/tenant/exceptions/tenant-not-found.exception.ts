import { NotFoundException } from '@nestjs/common';

export class TenantNotFoundException extends NotFoundException {
  constructor() {
    super('Tenant not found');
  }
}
