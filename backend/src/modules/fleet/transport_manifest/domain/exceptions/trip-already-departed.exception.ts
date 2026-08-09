import { ConflictException } from '@nestjs/common';

export class TripAlreadyDepartedException extends ConflictException {
  constructor() {
    super('Trip has already departed — manifests can no longer be changed');
  }
}
