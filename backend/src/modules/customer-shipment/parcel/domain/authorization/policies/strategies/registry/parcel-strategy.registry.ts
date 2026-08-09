import { Injectable } from '@nestjs/common';

import { ParcelAction } from '../../../actions/parcel.action';
import { ParcelAuthorizationStrategy } from '../interfaces/parcel-authorization-strategy.interface';

import { ViewParcelStrategy } from '../view-parcel.strategy';
import { UpdateParcelStatusStrategy } from '../update-parcel-status.strategy';

@Injectable()
export class ParcelStrategyRegistry {
  private readonly strategies = new Map<
    ParcelAction,
    ParcelAuthorizationStrategy
  >();

  constructor(
    viewStrategy: ViewParcelStrategy,
    updateStatusStrategy: UpdateParcelStatusStrategy,
  ) {
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStatusStrategy.action, updateStatusStrategy);
  }

  get<TPayload = unknown>(
    action: ParcelAction,
  ): ParcelAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy;
  }
}
