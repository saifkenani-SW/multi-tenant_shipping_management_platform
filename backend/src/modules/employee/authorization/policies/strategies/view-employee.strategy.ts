import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

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
import { ViewEmployeePayload } from '../payloads';
import { EmployeeAuthorizationStrategy } from './interfaces/employee-authorization-strategy.interface';

@Injectable()
export class ViewEmployeeStrategy implements EmployeeAuthorizationStrategy<ViewEmployeePayload> {
  readonly action = EmployeeAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(EMPLOYEE_QUERY_REPOSITORY_TOKEN)
    private readonly employeeQueryRepository: IEmployeeQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewEmployeePayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.employeeId) {
      if (!ability.can(EmployeeAction.View, EmployeeSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.employeeQueryRepository.findById(
      payload.employeeId,
    );

    // الصلاحية قبل الوجود: لا نكشف موظفي شركة أخرى عبر الفرق بين 403 و404.
    if (
      !ability.can(
        EmployeeAction.View,
        entity ? subject(EmployeeSubject, entity) : (EmployeeSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
