import { Injectable } from '@nestjs/common';

import { ShipmentRequestCommandService } from '../request/application/services/shipment-request.command.service';
import { ShipmentRequestQueryService } from '../request/application/services/shipment-request.query.service';

@Injectable()
export class ShipmentRequestFacade {
  constructor(
    private readonly shipmentRequestCommandService: ShipmentRequestCommandService,
    private readonly shipmentRequestQueryService: ShipmentRequestQueryService,
  ) {}

  async convertToShipment(requestId: string): Promise<void> {
    await this.shipmentRequestCommandService.convert(requestId);
  }

  async getShipmentRequest(requestId: string): Promise<any> {
    return this.shipmentRequestQueryService.findById(requestId);
  }
}
