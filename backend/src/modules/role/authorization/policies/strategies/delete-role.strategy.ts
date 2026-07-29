import { subject } from '@casl/ability';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

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
import { DeleteRolePayload } from '../payloads';
import { RoleAuthorizationStrategy } from './interfaces/role-authorization-strategy.interface';

@Injectable()
export class DeleteRoleStrategy implements RoleAuthorizationStrategy<DeleteRolePayload> {
  readonly action = RoleAction.Delete;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(ROLE_QUERY_REPOSITORY_TOKEN)
    private readonly roleQueryRepository: IRoleQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: DeleteRolePayload,
  ): Promise<void> {
    if (!payload?.roleId) {
      throw new BadRequestException('Role ID is required for authorization');
    }

    const ability = this.caslFactory.create(context.principal);
    const entity = await this.roleQueryRepository.findById(payload.roleId);

    if (
      !ability.can(
        RoleAction.Delete,
        entity ? subject(RoleSubject, entity) : (RoleSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
