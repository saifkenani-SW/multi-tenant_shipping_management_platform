import { Injectable } from '@nestjs/common';

import { ParcelAction } from '../actions/parcel.action';
import { ParcelStrategyRegistry } from './strategies/registry/parcel-strategy.registry';
import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';

@Injectable()
export class ParcelPolicy implements AuthorizationPolicy<ParcelAction> {
  constructor(private readonly registry: ParcelStrategyRegistry) {}

  async authorize(
    action: ParcelAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
