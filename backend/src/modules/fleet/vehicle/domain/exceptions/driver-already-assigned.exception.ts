import { ConflictException } from '@nestjs/common';

export class DriverAlreadyAssignedException extends ConflictException {
  constructor() {
    super(
      'Driver already has an active vehicle assignment. Release it before assigning a new vehicle.',
    );
  }
}
