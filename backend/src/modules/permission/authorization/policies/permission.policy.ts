import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { PermissionAction } from '../actions/permission.action';
import { PermissionStrategyRegistry } from './strategies/registry/permission-strategy.registry';

@Injectable()
export class PermissionPolicy implements AuthorizationPolicy<PermissionAction> {
  constructor(private readonly registry: PermissionStrategyRegistry) {}

  async authorize(
    action: PermissionAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
