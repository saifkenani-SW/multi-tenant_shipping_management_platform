import { NotFoundException } from '@nestjs/common';

export class GlobalLocationNotFoundException extends NotFoundException {
  constructor() {
    super('Global location not found');
  }
}
