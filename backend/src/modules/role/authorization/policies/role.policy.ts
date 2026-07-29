import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { RoleAction } from '../actions/role.action';
import { RoleStrategyRegistry } from './strategies/registry/role-strategy.registry';

@Injectable()
export class RolePolicy implements AuthorizationPolicy<RoleAction> {
  constructor(private readonly registry: RoleStrategyRegistry) {}

  async authorize(
    action: RoleAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
