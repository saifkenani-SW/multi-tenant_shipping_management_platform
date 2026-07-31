import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import type { IPermissionQueryRepository } from '../../permission/interfaces/permission.query.repository.interface';
import { PERMISSION_QUERY_REPOSITORY_TOKEN } from '../../permission/tokens/permission-repository.tokens';
import { PermissionAction } from '../actions/permission.action';
import { PermissionSubject } from '../subjects/permission.subject';

export interface ViewPermissionPayload {
  permissionId?: string;
}

@Injectable()
export class PermissionPolicy implements AuthorizationPolicy<PermissionAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(PERMISSION_QUERY_REPOSITORY_TOKEN)
    private readonly permissionQueryRepository: IPermissionQueryRepository,
  ) {}

  async authorize(
    action: PermissionAction,
    context: AuthorizationContext<Principal>,
    payload?: ViewPermissionPayload,
  ): Promise<void> {
    if (action !== PermissionAction.View) return;

    const ability = this.caslFactory.create(context.principal);

    if (!payload?.permissionId) {
      if (!ability.can(PermissionAction.View, PermissionSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.permissionQueryRepository.findById(
      payload.permissionId,
    );

    if (
      !ability.can(
        PermissionAction.View,
        entity
          ? subject(PermissionSubject, entity)
          : (PermissionSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
