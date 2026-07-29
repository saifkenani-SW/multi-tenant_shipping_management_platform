import { Injectable } from '@nestjs/common';

import { OrganizationUnitAction } from '../../../actions/organization-unit.action';
import { CreateOrganizationUnitStrategy } from '../create-organization-unit.strategy';
import { DeleteOrganizationUnitStrategy } from '../delete-organization-unit.strategy';
import { OrganizationUnitAuthorizationStrategy } from '../interfaces/organization-unit-authorization-strategy.interface';
import { ManageCoverageStrategy } from '../manage-coverage.strategy';
import { UpdateOrganizationUnitStrategy } from '../update-organization-unit.strategy';
import { ViewOrganizationUnitStrategy } from '../view-organization-unit.strategy';

@Injectable()
export class OrganizationUnitStrategyRegistry {
  private readonly strategies = new Map<
    OrganizationUnitAction,
    OrganizationUnitAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateOrganizationUnitStrategy,
    viewStrategy: ViewOrganizationUnitStrategy,
    updateStrategy: UpdateOrganizationUnitStrategy,
    deleteStrategy: DeleteOrganizationUnitStrategy,
    manageCoverageStrategy: ManageCoverageStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStrategy.action, updateStrategy);
    this.strategies.set(deleteStrategy.action, deleteStrategy);
    this.strategies.set(manageCoverageStrategy.action, manageCoverageStrategy);
  }

  get<TPayload = unknown>(
    action: OrganizationUnitAction,
  ): OrganizationUnitAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as OrganizationUnitAuthorizationStrategy<TPayload>;
  }
}
