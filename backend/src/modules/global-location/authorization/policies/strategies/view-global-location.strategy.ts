import { subject } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';

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
import { ViewGlobalLocationPayload } from '../payloads';
import { GlobalLocationAuthorizationStrategy } from './interfaces/global-location-authorization-strategy.interface';

@Injectable()
export class ViewGlobalLocationStrategy implements GlobalLocationAuthorizationStrategy<ViewGlobalLocationPayload> {
  readonly action = GlobalLocationAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN)
    private readonly locationQueryRepository: IGlobalLocationQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewGlobalLocationPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.locationId) {
      if (!ability.can(GlobalLocationAction.View, GlobalLocationSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.locationQueryRepository.findById(
      payload.locationId,
    );

    if (
      !ability.can(
        GlobalLocationAction.View,
        entity
          ? subject(GlobalLocationSubject, entity)
          : (GlobalLocationSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
