import { Injectable } from '@nestjs/common';

import { PermissionAction } from '../../../actions/permission.action';
import { PermissionAuthorizationStrategy } from '../interfaces/permission-authorization-strategy.interface';
import { ViewPermissionStrategy } from '../view-permission.strategy';

@Injectable()
export class PermissionStrategyRegistry {
  private readonly strategies = new Map<
    PermissionAction,
    PermissionAuthorizationStrategy
  >();

  constructor(viewPermissionStrategy: ViewPermissionStrategy) {
    this.strategies.set(viewPermissionStrategy.action, viewPermissionStrategy);
  }

  get<TPayload = unknown>(
    action: PermissionAction,
  ): PermissionAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as PermissionAuthorizationStrategy<TPayload>;
  }
}
