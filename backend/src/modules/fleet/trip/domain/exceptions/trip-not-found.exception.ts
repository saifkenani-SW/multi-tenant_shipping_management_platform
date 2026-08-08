import { NotFoundException } from '@nestjs/common';

export class TripNotFoundException extends NotFoundException {
  constructor() {
    super('Trip not found');
  }
}
