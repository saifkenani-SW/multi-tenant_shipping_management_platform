import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { NotificationFacade } from '../../../../notification/facades/notification.facade';
import { QUOTATION_EVENTS } from '../../constants/quotation.events';
import type {
  QuotationManualPriceRequestedPayload,
  QuotationManualPriceSubmittedPayload,
} from '../../constants/quotation.events';
import { ShipmentRequestQueryRepository } from '../../../request/infrastructure/repositories/shipment-request.query.repository';
import { UserFacade } from '../../../../user/application/facades/user.facade';

@Injectable()
export class QuotationListener {
  private readonly logger = new Logger(QuotationListener.name);

  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: Kysely<DB>,
    private readonly notificationFacade: NotificationFacade,
    private readonly shipmentRequestQueryRepository: ShipmentRequestQueryRepository,
    private readonly userFacade: UserFacade,
  ) {}

  @OnEvent(QUOTATION_EVENTS.MANUAL_PRICE_REQUESTED, { async: true })
  async handleManualPriceRequested(
    payload: QuotationManualPriceRequestedPayload,
  ) {
    try {
      const assignments = await this.db
        .selectFrom('employee_assignment as ea')
        .innerJoin('employee as e', 'e.id', 'ea.employee_id')
        .select('e.user_id')
        .where('ea.organization_unit_id', '=', payload.originOrgUnitId)
        .where('ea.is_active', '=', true)
        .execute();

      const userIds = assignments.map((a) => a.user_id);

      if (userIds.length > 0) {
        await this.notificationFacade.notifyUsers(userIds, {
          title: 'طلب تسعير جديد',
          body: `يوجد طلب تسعير شحنة جديد يرجى مراجعته وتسعيره. رقم الطلب: ${payload.shipmentRequestId}`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle MANUAL_PRICE_REQUESTED for quotation ${payload.quotationId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(QUOTATION_EVENTS.MANUAL_PRICE_SUBMITTED, { async: true })
  async handleManualPriceSubmitted(
    payload: QuotationManualPriceSubmittedPayload,
  ) {
    try {
      const request = await this.shipmentRequestQueryRepository.findById(
        payload.shipmentRequestId,
      );

      if (request && request.senderPhone) {
        const userSummary = await this.userFacade.getUserSummaryByPhone(
          request.senderPhone,
        );
        if (userSummary) {
          await this.notificationFacade.notifyUser(userSummary.id, {
            title: 'تم تسعير طلبك',
            body: `لقد قام الموظف بتسعير طلب الشحن الخاص بك (رقم الطلب: ${payload.shipmentRequestId})، يمكنك الآن مراجعته والموافقة عليه.`,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle MANUAL_PRICE_SUBMITTED for quotation ${payload.quotationId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
