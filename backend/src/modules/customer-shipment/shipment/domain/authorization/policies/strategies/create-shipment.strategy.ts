import { BadRequestException, Injectable } from '@nestjs/common';
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

/**
 * Nothing exists yet at creation time, so the ability is checked against the
 * tenant the shipment is about to belong to.
 */
@Injectable()
export class CreateShipmentStrategy implements ShipmentAuthorizationStrategy<ShipmentActionPayload> {
  readonly action = ShipmentAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  authorize(
    context: AuthorizationContext<Principal>,
    payload?: ShipmentActionPayload,
  ): Promise<void> {
    if (!payload?.tenantId) {
      throw new BadRequestException(
        'Tenant ID is required to authorize shipment creation.',
      );
    }

    const ability = this.caslFactory.create(context.principal);

    const candidate = subject(ShipmentSubject, {
      tenant_id: payload.tenantId,
    } as any);

    if (!ability.can(ShipmentAction.Create, candidate)) {
      throw new AccessDeniedException();
    }

    return Promise.resolve();
  }
}
