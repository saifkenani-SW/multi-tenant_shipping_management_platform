import { ConflictException } from '@nestjs/common';

export class TripCannotBeCancelledException extends ConflictException {
  constructor() {
    super('Trip cannot be cancelled after departure');
  }
}
