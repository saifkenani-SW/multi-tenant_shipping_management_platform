import { Injectable } from '@nestjs/common';

import { PodAction } from '../actions/pod.action';
import { PodStrategyRegistry } from './strategies/registry/pod-strategy.registry';
import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';

@Injectable()
export class PodPolicy implements AuthorizationPolicy<PodAction> {
  constructor(private readonly registry: PodStrategyRegistry) {}

  async authorize(
    action: PodAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
