import { Injectable } from '@nestjs/common';

import { RoleAction } from '../../../actions/role.action';
import { CreateRoleStrategy } from '../create-role.strategy';
import { DeleteRoleStrategy } from '../delete-role.strategy';
import { RoleAuthorizationStrategy } from '../interfaces/role-authorization-strategy.interface';
import { ManageRolePermissionsStrategy } from '../manage-role-permissions.strategy';
import { UpdateRoleStrategy } from '../update-role.strategy';
import { ViewRoleStrategy } from '../view-role.strategy';

@Injectable()
export class RoleStrategyRegistry {
  private readonly strategies = new Map<
    RoleAction,
    RoleAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateRoleStrategy,
    viewStrategy: ViewRoleStrategy,
    updateStrategy: UpdateRoleStrategy,
    deleteStrategy: DeleteRoleStrategy,
    managePermissionsStrategy: ManageRolePermissionsStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStrategy.action, updateStrategy);
    this.strategies.set(deleteStrategy.action, deleteStrategy);
    this.strategies.set(
      managePermissionsStrategy.action,
      managePermissionsStrategy,
    );
  }

  get<TPayload = unknown>(
    action: RoleAction,
  ): RoleAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as RoleAuthorizationStrategy<TPayload>;
  }
}
