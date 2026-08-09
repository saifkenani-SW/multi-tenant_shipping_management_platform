import { ConflictException } from '@nestjs/common';

export class ManifestNotModifiableException extends ConflictException {
  constructor() {
    super(
      'Manifest can only be modified while PENDING — parcels cannot be loaded after the trip departs, and a completed manifest is immutable',
    );
  }
}
