import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShipmentStatus } from '@prisma/client';
import { ShipmentQueryRepository } from '../../infrastructure/repositories/shipment.query.repository';
import { ShipmentCommandRepository } from '../../infrastructure/repositories/shipment.command.repository';
import { ParcelQueryRepository } from '../../../parcel/infrastructure/repositories/parcel.query.repository';
import {
  CUSTOMER_SHIPMENT_EVENTS,
  CustomerShipmentLifecyclePayload,
} from '../../../constants/customer-shipment.events';

/**
 * Re-derives a shipment status from the state of its parcels.
 *
 * This lives apart from ShipmentCommandService on purpose. The parcel side has
 * to trigger a recalculation whenever a parcel moves, while the shipment side
 * creates parcels — wiring the two command services to each other would form a
 * dependency cycle. This narrow collaborator depends only on repositories, so
 * both sides can use it.
 *
 * It is always called from inside a caller-owned @Transactional() block.
 */
@Injectable()
export class ShipmentStatusRecalculator {
  constructor(
    private readonly shipmentQueryRepository: ShipmentQueryRepository,
    private readonly shipmentCommandRepository: ShipmentCommandRepository,
    private readonly parcelQueryRepository: ParcelQueryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recalculateFromParcels(shipmentId: string): Promise<void> {
    const shipment =
      await this.shipmentQueryRepository.findAggregateById(shipmentId);

    if (!shipment) {
      return;
    }

    const parcelStatuses =
      await this.parcelQueryRepository.findStatusesByShipmentId(shipmentId);

    const newStatus = shipment.recalculateStatus(parcelStatuses);

    if (!newStatus) {
      return;
    }

    await this.shipmentCommandRepository.updateStatus(
      shipmentId,
      newStatus,
      shipment.version,
    );

    await this.emitLifecycleEvent(newStatus, shipmentId, shipment.tenantId);
  }

  private async emitLifecycleEvent(
    status: ShipmentStatus,
    shipmentId: string,
    tenantId: string,
  ): Promise<void> {
    const payload: CustomerShipmentLifecyclePayload = { shipmentId, tenantId };

    if (status === ShipmentStatus.DELIVERED) {
      await this.eventEmitter.emitAsync(
        CUSTOMER_SHIPMENT_EVENTS.DELIVERED,
        payload,
      );
      return;
    }

    if (status === ShipmentStatus.RETURNED) {
      await this.eventEmitter.emitAsync(
        CUSTOMER_SHIPMENT_EVENTS.RETURNED,
        payload,
      );
    }
  }
}
