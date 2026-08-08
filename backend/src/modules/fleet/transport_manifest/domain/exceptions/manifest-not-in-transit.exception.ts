import { ConflictException } from '@nestjs/common';

export class ManifestNotInTransitException extends ConflictException {
  constructor() {
    super('Manifest must be IN_TRANSIT before it can be completed');
  }
}
