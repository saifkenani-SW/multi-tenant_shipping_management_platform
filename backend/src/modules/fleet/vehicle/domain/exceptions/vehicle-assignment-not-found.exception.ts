import { NotFoundException } from '@nestjs/common';

export class VehicleAssignmentNotFoundException extends NotFoundException {
  constructor() {
    super('Vehicle assignment not found');
  }
}
