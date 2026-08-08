import { ConflictException } from '@nestjs/common';

export class TripAlreadyStartedException extends ConflictException {
  constructor() {
    super('Trip has already departed and cannot be started again');
  }
}
