import { ConflictException } from '@nestjs/common';

export class TripNotEditableException extends ConflictException {
  constructor() {
    super('Trip can only be edited while it is still SCHEDULED');
  }
}
