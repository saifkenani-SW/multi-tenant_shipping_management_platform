import { subject } from '@casl/ability';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import type { IGlobalLocationQueryRepository } from '../../../interfaces/global-location.query.repository.interface';
import { GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN } from '../../../tokens/global-location-repository.tokens';
import { GlobalLocationAction } from '../../actions/global-location.action';
import { GlobalLocationSubject } from '../../subjects/global-location.subject';
import { DeleteGlobalLocationPayload } from '../payloads';
import { GlobalLocationAuthorizationStrategy } from './interfaces/global-location-authorization-strategy.interface';

@Injectable()
export class DeleteGlobalLocationStrategy implements GlobalLocationAuthorizationStrategy<DeleteGlobalLocationPayload> {
  readonly action = GlobalLocationAction.Delete;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN)
    private readonly locationQueryRepository: IGlobalLocationQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: DeleteGlobalLocationPayload,
  ): Promise<void> {
    if (!payload?.locationId) {
      throw new BadRequestException(
        'Location ID is required for authorization',
      );
    }

    const ability = this.caslFactory.create(context.principal);
    const entity = await this.locationQueryRepository.findById(
      payload.locationId,
    );

    if (
      !ability.can(
        GlobalLocationAction.Delete,
        entity
          ? subject(GlobalLocationSubject, entity)
          : (GlobalLocationSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
