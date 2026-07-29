import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  CapabilityBuilder,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { Employee } from '../../domain/employee.entity';
import { EmployeeAction } from '../actions/employee.action';
import { EmployeeSubject } from '../subjects/employee.subject';
import { EmployeeCapabilities } from './employee.capabilities.interface';

@Injectable()
export class EmployeeCapabilityBuilder implements CapabilityBuilder<
  Employee,
  EmployeeCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: Employee,
    context: AuthorizationContext<Principal>,
  ): EmployeeCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const employeeSubject = subject(EmployeeSubject, entity);

    return {
      canUpdate: ability.can(EmployeeAction.Update, employeeSubject),
      canChangeStatus: ability.can(
        EmployeeAction.ChangeStatus,
        employeeSubject,
      ),
      canManageAssignments: ability.can(
        EmployeeAction.ManageAssignments,
        employeeSubject,
      ),
    };
  }
}
