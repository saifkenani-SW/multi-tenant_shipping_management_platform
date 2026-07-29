import { subject } from '@casl/ability';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import type { IEmployeeQueryRepository } from '../../../interfaces/employee.query.repository.interface';
import { EMPLOYEE_QUERY_REPOSITORY_TOKEN } from '../../../tokens/employee-repository.tokens';
import { EmployeeAction } from '../../actions/employee.action';
import { EmployeeSubject } from '../../subjects/employee.subject';
import { ChangeEmployeeStatusPayload } from '../payloads';
import { EmployeeAuthorizationStrategy } from './interfaces/employee-authorization-strategy.interface';

@Injectable()
export class ChangeEmployeeStatusStrategy implements EmployeeAuthorizationStrategy<ChangeEmployeeStatusPayload> {
  readonly action = EmployeeAction.ChangeStatus;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(EMPLOYEE_QUERY_REPOSITORY_TOKEN)
    private readonly employeeQueryRepository: IEmployeeQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ChangeEmployeeStatusPayload,
  ): Promise<void> {
    if (!payload?.employeeId) {
      throw new BadRequestException(
        'Employee ID is required for authorization',
      );
    }

    const ability = this.caslFactory.create(context.principal);
    const entity = await this.employeeQueryRepository.findById(
      payload.employeeId,
    );

    if (
      !ability.can(
        EmployeeAction.ChangeStatus,
        entity ? subject(EmployeeSubject, entity) : (EmployeeSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
