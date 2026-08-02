import { NotFoundException } from '@nestjs/common';

export class CustomerShipmentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Customer shipment with ID ${id} not found`);
  }
}
