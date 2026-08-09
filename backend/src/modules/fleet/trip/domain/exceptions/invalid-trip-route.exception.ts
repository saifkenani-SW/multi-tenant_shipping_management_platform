import { BadRequestException } from '@nestjs/common';

export class InvalidTripRouteException extends BadRequestException {
  constructor() {
    super(
      'Trip origin and destination must be two different organization units',
    );
  }
}
