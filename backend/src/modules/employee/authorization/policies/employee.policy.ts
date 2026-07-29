import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { EmployeeAction } from '../actions/employee.action';
import { EmployeeStrategyRegistry } from './strategies/registry/employee-strategy.registry';

@Injectable()
export class EmployeePolicy implements AuthorizationPolicy<EmployeeAction> {
  constructor(private readonly registry: EmployeeStrategyRegistry) {}

  async authorize(
    action: EmployeeAction,
    context: AuthorizationContext,
    payload?: unknown,
  ): Promise<void> {
    const strategy = this.registry.get(action);

    await strategy.authorize(context, payload);
  }
}
