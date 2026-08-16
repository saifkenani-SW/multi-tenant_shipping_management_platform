import { ConflictException } from '@nestjs/common';

export class ManifestNotModifiableException extends ConflictException {
  constructor(message?: string) {
    super(
      message ||
        'Manifest can only be modified while OPEN — parcels cannot be loaded after the trip departs, and a completed manifest is immutable',
    );
  }
}
