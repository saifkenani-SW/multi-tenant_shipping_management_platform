import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CUSTOMER_SHIPMENT_EVENTS } from '../../../constants/customer-shipment.events';
import type { CustomerShipmentLifecyclePayload } from '../../../constants/customer-shipment.events';
import { ShipmentQueryRepository } from '../../infrastructure/repositories/shipment.query.repository';
import { UserFacade } from '../../../../user/application/facades/user.facade';
import { NotificationFacade } from '../../../../notification/facades/notification.facade';

@Injectable()
export class ShipmentDeliveredListener {
  private readonly logger = new Logger(ShipmentDeliveredListener.name);

  constructor(
    private readonly shipmentQueryRepository: ShipmentQueryRepository,
    private readonly userFacade: UserFacade,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  @OnEvent(CUSTOMER_SHIPMENT_EVENTS.DELIVERED, { async: true })
  async handleShipmentDeliveredEvent(
    payload: CustomerShipmentLifecyclePayload,
  ) {
    try {
      const shipment = await this.shipmentQueryRepository.findRawById(
        payload.shipmentId,
      );
      if (!shipment || !shipment.sender_phone) {
        return;
      }

      const userSummary = await this.userFacade.getUserSummaryByPhone(
        shipment.sender_phone,
      );
      if (!userSummary) {
        return; // No registered user for this phone
      }

      await this.notificationFacade.notifyUser(userSummary.id, {
        title: 'تم تسليم الشحنة بنجاح',
        body: `المستلم استلم الشحنة بنجاح. رقم الشحنة: ${shipment.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to process DELIVERED event for shipment ${payload.shipmentId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
