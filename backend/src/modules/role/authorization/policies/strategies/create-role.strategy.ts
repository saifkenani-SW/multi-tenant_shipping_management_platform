import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { RoleAction } from '../../actions/role.action';
import { RoleSubject } from '../../subjects/role.subject';
import { CreateRolePayload } from '../payloads';
import { RoleAuthorizationStrategy } from './interfaces/role-authorization-strategy.interface';

@Injectable()
export class CreateRoleStrategy implements RoleAuthorizationStrategy<CreateRolePayload> {
  readonly action = RoleAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    _payload?: CreateRolePayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    // الدور لم يُنشأ بعد، فنفحص على كيان افتراضي يحمل الـ tenant الذي
    // سيُنشأ فيه — وإلا تجاوزنا شرط { tenantId } في RoleAbility.
    const candidate =
      context.principal.subject.type === SubjectType.PLATFORM_ADMIN
        ? RoleSubject
        : subject(RoleSubject, {
            tenantId: context.principal.tenantId,
          } as never);

    if (!ability.can(RoleAction.Create, candidate)) {
      throw new AccessDeniedException();
    }
  }
}
