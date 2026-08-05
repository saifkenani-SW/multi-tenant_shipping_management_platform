import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { EmployeeAction } from '../../actions/employee.action';
import { EmployeeSubject } from '../../subjects/employee.subject';
import { CreateEmployeePayload } from '../payloads';
import { EmployeeAuthorizationStrategy } from './interfaces/employee-authorization-strategy.interface';

@Injectable()
export class CreateEmployeeStrategy implements EmployeeAuthorizationStrategy<CreateEmployeePayload> {
  readonly action = EmployeeAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    _payload?: CreateEmployeePayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    const candidate =
      context.principal.subject.type === SubjectType.PLATFORM_OWNER
        ? EmployeeSubject
        : subject(EmployeeSubject, {
            tenantId: context.principal.tenantId,
          } as never);

    if (!ability.can(EmployeeAction.Create, candidate)) {
      throw new AccessDeniedException();
    }
  }
}
