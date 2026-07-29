import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { GlobalLocationAction } from '../actions/global-location.action';
import { GlobalLocationStrategyRegistry } from './strategies/registry/global-location-strategy.registry';

@Injectable()
export class GlobalLocationPolicy implements AuthorizationPolicy<GlobalLocationAction> {
  constructor(private readonly registry: GlobalLocationStrategyRegistry) {}

  async authorize(
    action: GlobalLocationAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
