import { Injectable } from '@nestjs/common';

import { ShipmentAction } from '../../../actions/shipment.action';
import { ShipmentAuthorizationStrategy } from '../interfaces/shipment-authorization-strategy.interface';

import { CreateShipmentStrategy } from '../create-shipment.strategy';
import { ViewShipmentStrategy } from '../view-shipment.strategy';
import { UpdateShipmentStrategy } from '../update-shipment.strategy';
import { CancelShipmentStrategy } from '../cancel-shipment.strategy';

@Injectable()
export class ShipmentStrategyRegistry {
  private readonly strategies = new Map<
    ShipmentAction,
    ShipmentAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateShipmentStrategy,
    viewStrategy: ViewShipmentStrategy,
    updateStrategy: UpdateShipmentStrategy,
    cancelStrategy: CancelShipmentStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStrategy.action, updateStrategy);
    this.strategies.set(cancelStrategy.action, cancelStrategy);
  }

  get<TPayload = unknown>(
    action: ShipmentAction,
  ): ShipmentAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy;
  }
}
