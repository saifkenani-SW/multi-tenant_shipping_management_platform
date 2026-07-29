import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import type { IOrganizationUnitQueryRepository } from '../../../interfaces/organization-unit.query.repository.interface';
import { ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN } from '../../../tokens/organization-unit-repository.tokens';
import { OrganizationUnitAction } from '../../actions/organization-unit.action';
import { OrganizationUnitSubject } from '../../subjects/organization-unit.subject';
import { ViewOrganizationUnitPayload } from '../payloads';
import { OrganizationUnitAuthorizationStrategy } from './interfaces/organization-unit-authorization-strategy.interface';

@Injectable()
export class ViewOrganizationUnitStrategy implements OrganizationUnitAuthorizationStrategy<ViewOrganizationUnitPayload> {
  readonly action = OrganizationUnitAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN)
    private readonly unitQueryRepository: IOrganizationUnitQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewOrganizationUnitPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.unitId) {
      if (!ability.can(OrganizationUnitAction.View, OrganizationUnitSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.unitQueryRepository.findById(payload.unitId);

    // الصلاحية قبل الوجود: لا نكشف وجود وحدة في شركة أخرى عبر 404.
    if (
      !ability.can(
        OrganizationUnitAction.View,
        entity
          ? subject(OrganizationUnitSubject, entity)
          : (OrganizationUnitSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
