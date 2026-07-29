import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { OrganizationUnitAction } from '../actions/organization-unit.action';
import { OrganizationUnitStrategyRegistry } from './strategies/registry/organization-unit-strategy.registry';

@Injectable()
export class OrganizationUnitPolicy implements AuthorizationPolicy<OrganizationUnitAction> {
  constructor(private readonly registry: OrganizationUnitStrategyRegistry) {}

  async authorize(
    action: OrganizationUnitAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
