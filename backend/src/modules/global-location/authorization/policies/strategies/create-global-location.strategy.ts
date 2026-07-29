import { Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { GlobalLocationAction } from '../../actions/global-location.action';
import { GlobalLocationSubject } from '../../subjects/global-location.subject';
import { CreateGlobalLocationPayload } from '../payloads';
import { GlobalLocationAuthorizationStrategy } from './interfaces/global-location-authorization-strategy.interface';

@Injectable()
export class CreateGlobalLocationStrategy implements GlobalLocationAuthorizationStrategy<CreateGlobalLocationPayload> {
  readonly action = GlobalLocationAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    _payload?: CreateGlobalLocationPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(GlobalLocationAction.Create, GlobalLocationSubject)) {
      throw new AccessDeniedException();
    }
  }
}
