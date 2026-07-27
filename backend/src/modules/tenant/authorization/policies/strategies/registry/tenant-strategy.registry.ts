import { Injectable } from '@nestjs/common';

import { TenantAction } from '../../../actions/tenant.action';
import { TenantAuthorizationStrategy } from '../interfaces/tenant-authorization-strategy.interface';

import { CreateTenantStrategy } from '../create-tenant.strategy';
import { UpdateTenantStrategy } from '../update-tenant.strategy';
import { DeleteTenantStrategy } from '../delete-tenant.strategy';
import { ViewTenantStrategy } from '../view-tenant.strategy';
import { SuspendTenantStrategy } from '../suspend-tenant.strategy';
import { ActivateTenantStrategy } from '../activate-tenant.strategy';

@Injectable()
export class TenantStrategyRegistry {
  private readonly strategies = new Map<
    TenantAction,
    TenantAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateTenantStrategy,
    updateStrategy: UpdateTenantStrategy,
    deleteStrategy: DeleteTenantStrategy,
    viewTenantStrategy: ViewTenantStrategy,
    suspendTenantStrategy: SuspendTenantStrategy,
    activateTenantStrategy: ActivateTenantStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);

    this.strategies.set(updateStrategy.action, updateStrategy);

    this.strategies.set(deleteStrategy.action, deleteStrategy);

    this.strategies.set(viewTenantStrategy.action, viewTenantStrategy);

    this.strategies.set(suspendTenantStrategy.action, suspendTenantStrategy);

    this.strategies.set(activateTenantStrategy.action, activateTenantStrategy);
  }

  get<TPayload = unknown>(
    action: TenantAction,
  ): TenantAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as TenantAuthorizationStrategy<TPayload>;
  }
}
