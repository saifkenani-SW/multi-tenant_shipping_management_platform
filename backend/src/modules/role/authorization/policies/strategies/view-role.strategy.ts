import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import type { IRoleQueryRepository } from '../../../interfaces/role.query.repository.interface';
import { ROLE_QUERY_REPOSITORY_TOKEN } from '../../../tokens/role-repository.tokens';
import { RoleAction } from '../../actions/role.action';
import { RoleSubject } from '../../subjects/role.subject';
import { ViewRolePayload } from '../payloads';
import { RoleAuthorizationStrategy } from './interfaces/role-authorization-strategy.interface';

@Injectable()
export class ViewRoleStrategy implements RoleAuthorizationStrategy<ViewRolePayload> {
  readonly action = RoleAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(ROLE_QUERY_REPOSITORY_TOKEN)
    private readonly roleQueryRepository: IRoleQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewRolePayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    // القوائم لا تحمل معرّفاً: يُفحص النوع مجرداً ثم يقصر الـ scope الصفوف.
    if (!payload?.roleId) {
      if (!ability.can(RoleAction.View, RoleSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.roleQueryRepository.findById(payload.roleId);

    // الصلاحية قبل الوجود: لا نكشف وجود دور في tenant آخر عبر 404.
    if (
      !ability.can(
        RoleAction.View,
        entity ? subject(RoleSubject, entity) : (RoleSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
