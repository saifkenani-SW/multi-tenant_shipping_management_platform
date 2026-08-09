import { Injectable } from '@nestjs/common';

import { ShipmentAction } from '../actions/shipment.action';
import { ShipmentStrategyRegistry } from './strategies/registry/shipment-strategy.registry';
import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';

@Injectable()
export class ShipmentPolicy implements AuthorizationPolicy<ShipmentAction> {
  constructor(private readonly registry: ShipmentStrategyRegistry) {}

  async authorize(
    action: ShipmentAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
