import { ConflictException } from '@nestjs/common';

export class DuplicateManifestParcelException extends ConflictException {
  constructor() {
    super('Parcel is already listed on this manifest');
  }
}
