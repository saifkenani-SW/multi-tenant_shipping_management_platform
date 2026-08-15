import { Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';

import { ShipmentAction } from '../actions/shipment.action';
import { ShipmentSubject } from '../subjects/shipment.subject';
import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { ShipmentQueryRepository } from '../../../../shipment/infrastructure/repositories/shipment.query.repository';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';

export interface ShipmentActionPayload {
  originOrgUnitId?: string;
  shipmentId?: string;
}

@Injectable()
export class ShipmentPolicy implements AuthorizationPolicy<ShipmentAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder,
    private readonly queryRepo: ShipmentQueryRepository,
  ) {}

  async authorize(
    action: ShipmentAction,
    context: AuthorizationContext,
    payload?: ShipmentActionPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    switch (action) {
      case ShipmentAction.Create: {
        const principal = context.principal as Principal;
        const candidate = subject(ShipmentSubject, {
          tenantId: principal.tenantId,
          originOrgUnitId: payload?.originOrgUnitId,
        } as any);

        if (!ability.can(action, candidate)) {
          throw new AccessDeniedException(
            `You are not allowed to perform ${action} on this resource.`,
          );
        }
        break;
      }

      case ShipmentAction.Update:
      case ShipmentAction.Cancel:
      case ShipmentAction.Return:
      case ShipmentAction.View: {
        if (!payload?.shipmentId) {
          throw new AccessDeniedException('Missing shipment ID.');
        }

        const shipment = await this.queryRepo.findAggregateById(
          payload.shipmentId,
        );
        if (!shipment) {
          throw new AccessDeniedException('Shipment not found.');
        }

        if (!ability.can(action, subject(ShipmentSubject, shipment))) {
          throw new AccessDeniedException(
            `You are not allowed to perform ${action} on this resource.`,
          );
        }
        break;
      }
    }
  }
}
