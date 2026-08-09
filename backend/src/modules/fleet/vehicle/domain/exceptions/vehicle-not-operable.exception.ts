import { BadRequestException } from '@nestjs/common';

export class VehicleNotOperableException extends BadRequestException {
  constructor() {
    super('Vehicle is not ACTIVE and cannot be dispatched on a trip');
  }
}
