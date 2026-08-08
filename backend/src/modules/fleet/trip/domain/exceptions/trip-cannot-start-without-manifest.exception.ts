import { BadRequestException } from '@nestjs/common';

export class TripCannotStartWithoutManifestException extends BadRequestException {
  constructor() {
    super('Trip cannot start without at least one manifest');
  }
}
