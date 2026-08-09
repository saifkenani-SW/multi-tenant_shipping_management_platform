import { Injectable } from '@nestjs/common';

import { ShipmentRequestCommandService } from '../request/application/services/shipment-request.command.service';

@Injectable()
export class ShipmentRequestFacade {
  constructor(
    private readonly shipmentRequestCommandService: ShipmentRequestCommandService,
  ) {}

  async convertToShipment(requestId: string): Promise<void> {
    await this.shipmentRequestCommandService.convert(requestId);
  }
}
