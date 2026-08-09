import { NotFoundException } from '@nestjs/common';

export class ManifestItemNotFoundException extends NotFoundException {
  constructor() {
    super('Manifest item not found');
  }
}
