import { BadRequestException } from '@nestjs/common';

export class DriverHasNoVehicleException extends BadRequestException {
  constructor() {
    super('The selected driver does not have an active vehicle assignment.');
  }
}
