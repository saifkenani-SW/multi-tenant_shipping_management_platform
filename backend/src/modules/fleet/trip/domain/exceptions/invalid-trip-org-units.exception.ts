import { BadRequestException } from '@nestjs/common';

export class InvalidTripOrgUnitsException extends BadRequestException {
  constructor() {
    super(
      'One or more organization units do not exist or do not belong to this tenant',
    );
  }
}
