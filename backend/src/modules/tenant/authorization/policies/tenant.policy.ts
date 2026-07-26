import { Injectable } from '@nestjs/common';

import { TenantAction } from '../actions/tenant.action';
import { TenantStrategyRegistry } from './strategies/registry/tenant-strategy.registry';
import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';

@Injectable()
export class TenantPolicy implements AuthorizationPolicy<TenantAction> {
  constructor(private readonly registry: TenantStrategyRegistry) {}

  async authorize(
    action: TenantAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
