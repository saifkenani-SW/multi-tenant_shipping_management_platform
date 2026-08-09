import { NotFoundException } from '@nestjs/common';

export class VehicleNotFoundException extends NotFoundException {
  constructor() {
    super('Vehicle not found');
  }
}
