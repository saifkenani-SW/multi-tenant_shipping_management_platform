import { ConflictException } from '@nestjs/common';

export class TripNotStartedException extends ConflictException {
  constructor() {
    super('Trip cannot be completed before it has departed');
  }
}
