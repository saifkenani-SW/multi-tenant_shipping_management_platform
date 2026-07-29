import { Injectable } from '@nestjs/common';

import { GlobalLocationAction } from '../../../actions/global-location.action';
import { CreateGlobalLocationStrategy } from '../create-global-location.strategy';
import { DeleteGlobalLocationStrategy } from '../delete-global-location.strategy';
import { GlobalLocationAuthorizationStrategy } from '../interfaces/global-location-authorization-strategy.interface';
import { UpdateGlobalLocationStrategy } from '../update-global-location.strategy';
import { ViewGlobalLocationStrategy } from '../view-global-location.strategy';

@Injectable()
export class GlobalLocationStrategyRegistry {
  private readonly strategies = new Map<
    GlobalLocationAction,
    GlobalLocationAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateGlobalLocationStrategy,
    viewStrategy: ViewGlobalLocationStrategy,
    updateStrategy: UpdateGlobalLocationStrategy,
    deleteStrategy: DeleteGlobalLocationStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStrategy.action, updateStrategy);
    this.strategies.set(deleteStrategy.action, deleteStrategy);
  }

  get<TPayload = unknown>(
    action: GlobalLocationAction,
  ): GlobalLocationAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as GlobalLocationAuthorizationStrategy<TPayload>;
  }
}
