import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { ShipmentAuthorizationStrategy } from './interfaces/shipment-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../../packages/context/principal/principal/Principal';
import { ShipmentAction } from '../../actions/shipment.action';
import { ShipmentSubject } from '../../subjects/shipment.subject';
import { ShipmentActionPayload } from '../payloads/shipment-action.payload';
import { ShipmentQueryRepository } from '../../../../infrastructure/repositories/shipment.query.repository';

@Injectable()
export class CancelShipmentStrategy implements ShipmentAuthorizationStrategy<ShipmentActionPayload> {
  readonly action = ShipmentAction.Cancel;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly queryRepository: ShipmentQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ShipmentActionPayload,
  ): Promise<void> {
    if (!payload?.shipmentId) {
      throw new BadRequestException(
        'Shipment ID is required for authorization.',
      );
    }

    const entity = await this.queryRepository.findRawById(payload.shipmentId);
    if (!entity) {
      throw new NotFoundException('Shipment not found');
    }

    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(ShipmentAction.Cancel, subject(ShipmentSubject, entity))) {
      throw new AccessDeniedException();
    }
  }
}
