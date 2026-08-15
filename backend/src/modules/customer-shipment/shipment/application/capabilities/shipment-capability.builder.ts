import { Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  CapabilityBuilder,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { ShipmentAction } from '../../domain/authorization/actions/shipment.action';
import { ShipmentSubject } from '../../domain/authorization/subjects/shipment.subject';
import { ShipmentDetailsResponseDto } from '../dtos/responses/shipment-details.response.dto';
import { ShipmentCapabilities } from './shipment.capabilities.interface';

@Injectable()
export class ShipmentCapabilityBuilder implements CapabilityBuilder<
  ShipmentDetailsResponseDto,
  ShipmentCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: ShipmentDetailsResponseDto,
    context: AuthorizationContext<Principal>,
  ): ShipmentCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const shipmentSubject = subject(ShipmentSubject, entity);

    return {
      canView: ability.can(ShipmentAction.View, shipmentSubject),
      canUpdate: ability.can(ShipmentAction.Update, shipmentSubject),
      canCancel: ability.can(ShipmentAction.Cancel, shipmentSubject),
      canReturn: ability.can(ShipmentAction.Return, shipmentSubject),
      canRecordPayment: ability.can(
        ShipmentAction.RecordPayment,
        shipmentSubject,
      ),
    };
  }
}
