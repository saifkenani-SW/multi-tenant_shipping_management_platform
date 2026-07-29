import { subject } from '@casl/ability';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

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
import { DeleteOrganizationUnitPayload } from '../payloads';
import { OrganizationUnitAuthorizationStrategy } from './interfaces/organization-unit-authorization-strategy.interface';

@Injectable()
export class DeleteOrganizationUnitStrategy implements OrganizationUnitAuthorizationStrategy<DeleteOrganizationUnitPayload> {
  readonly action = OrganizationUnitAction.Delete;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN)
    private readonly unitQueryRepository: IOrganizationUnitQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: DeleteOrganizationUnitPayload,
  ): Promise<void> {
    if (!payload?.unitId) {
      throw new BadRequestException('Unit ID is required for authorization');
    }

    const ability = this.caslFactory.create(context.principal);
    const entity = await this.unitQueryRepository.findById(payload.unitId);

    if (
      !ability.can(
        OrganizationUnitAction.Delete,
        entity
          ? subject(OrganizationUnitSubject, entity)
          : (OrganizationUnitSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
