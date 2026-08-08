import { ConflictException } from '@nestjs/common';

export class VehicleAlreadyAssignedException extends ConflictException {
  constructor() {
    super(
      'Vehicle already has an active driver assignment. Release it before assigning a new driver.',
    );
  }
}
