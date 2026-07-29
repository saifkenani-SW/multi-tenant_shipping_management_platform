import { Injectable } from '@nestjs/common';

import { EmployeeAction } from '../../../actions/employee.action';
import { ChangeEmployeeStatusStrategy } from '../change-employee-status.strategy';
import { CreateEmployeeStrategy } from '../create-employee.strategy';
import { EmployeeAuthorizationStrategy } from '../interfaces/employee-authorization-strategy.interface';
import { ManageAssignmentsStrategy } from '../manage-assignments.strategy';
import { UpdateEmployeeStrategy } from '../update-employee.strategy';
import { ViewEmployeeStrategy } from '../view-employee.strategy';

@Injectable()
export class EmployeeStrategyRegistry {
  private readonly strategies = new Map<
    EmployeeAction,
    EmployeeAuthorizationStrategy
  >();

  constructor(
    createStrategy: CreateEmployeeStrategy,
    viewStrategy: ViewEmployeeStrategy,
    updateStrategy: UpdateEmployeeStrategy,
    changeStatusStrategy: ChangeEmployeeStatusStrategy,
    manageAssignmentsStrategy: ManageAssignmentsStrategy,
  ) {
    this.strategies.set(createStrategy.action, createStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
    this.strategies.set(updateStrategy.action, updateStrategy);
    this.strategies.set(changeStatusStrategy.action, changeStatusStrategy);
    this.strategies.set(
      manageAssignmentsStrategy.action,
      manageAssignmentsStrategy,
    );
  }

  get<TPayload = unknown>(
    action: EmployeeAction,
  ): EmployeeAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy as EmployeeAuthorizationStrategy<TPayload>;
  }
}
