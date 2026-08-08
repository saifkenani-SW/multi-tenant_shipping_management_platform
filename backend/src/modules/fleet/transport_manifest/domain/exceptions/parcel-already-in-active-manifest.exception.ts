import { ConflictException } from '@nestjs/common';

export class ParcelAlreadyInActiveManifestException extends ConflictException {
  constructor() {
    super('Parcel already belongs to another active manifest');
  }
}
