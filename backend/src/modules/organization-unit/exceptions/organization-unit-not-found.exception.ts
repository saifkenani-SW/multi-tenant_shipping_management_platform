import { NotFoundException } from '@nestjs/common';

export class OrganizationUnitNotFoundException extends NotFoundException {
  constructor() {
    super('Organization unit not found');
  }
}
