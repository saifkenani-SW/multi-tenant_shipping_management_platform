import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { OrganizationUnitAction } from '../../actions/organization-unit.action';
import { OrganizationUnitSubject } from '../../subjects/organization-unit.subject';
import { CreateOrganizationUnitPayload } from '../payloads';
import { OrganizationUnitAuthorizationStrategy } from './interfaces/organization-unit-authorization-strategy.interface';

@Injectable()
export class CreateOrganizationUnitStrategy implements OrganizationUnitAuthorizationStrategy<CreateOrganizationUnitPayload> {
  readonly action = OrganizationUnitAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    _payload?: CreateOrganizationUnitPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    // الوحدة لم تُنشأ بعد: نفحص على كيان افتراضي يحمل الـ tenant الهدف
    // وإلا تجاوزنا شرط { tenantId } في OrganizationUnitAbility.
    const candidate =
      context.principal.subject.type === SubjectType.PLATFORM_ADMIN
        ? OrganizationUnitSubject
        : subject(OrganizationUnitSubject, {
            tenantId: context.principal.tenantId,
          } as never);

    if (!ability.can(OrganizationUnitAction.Create, candidate)) {
      throw new AccessDeniedException();
    }
  }
}
