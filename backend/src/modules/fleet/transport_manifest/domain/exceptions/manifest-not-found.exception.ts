import { NotFoundException } from '@nestjs/common';

export class ManifestNotFoundException extends NotFoundException {
  constructor() {
    super('Transport manifest not found');
  }
}
