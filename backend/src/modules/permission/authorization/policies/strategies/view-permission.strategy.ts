import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import type { IPermissionQueryRepository } from '../../../interfaces/permission.query.repository.interface';
import { PERMISSION_QUERY_REPOSITORY_TOKEN } from '../../../tokens/permission-repository.tokens';
import { PermissionAction } from '../../actions/permission.action';
import { PermissionSubject } from '../../subjects/permission.subject';
import { ViewPermissionPayload } from '../payloads/view-permission.payload';
import { PermissionAuthorizationStrategy } from './interfaces/permission-authorization-strategy.interface';

@Injectable()
export class ViewPermissionStrategy implements PermissionAuthorizationStrategy<ViewPermissionPayload> {
  readonly action = PermissionAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(PERMISSION_QUERY_REPOSITORY_TOKEN)
    private readonly permissionQueryRepository: IPermissionQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewPermissionPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    // القوائم لا تحمل معرّفاً: يُفحص النوع مجرداً ثم يتكفل الـ scope بالصفوف.
    if (!payload?.permissionId) {
      if (!ability.can(PermissionAction.View, PermissionSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.permissionQueryRepository.findById(
      payload.permissionId,
    );

    // الصلاحية تُفحص قبل الوجود حتى لا يكشف الفرق بين 403 و404 وجود الصف.
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
