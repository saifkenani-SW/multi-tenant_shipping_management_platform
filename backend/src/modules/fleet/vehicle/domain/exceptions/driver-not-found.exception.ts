import { BadRequestException } from '@nestjs/common';

export class DriverNotFoundException extends BadRequestException {
  constructor() {
    super('Driver (employee) does not exist in this tenant');
  }
}
