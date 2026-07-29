import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  CapabilityBuilder,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { GlobalLocation } from '../../domain/global-location.entity';
import { GlobalLocationAction } from '../actions/global-location.action';
import { GlobalLocationSubject } from '../subjects/global-location.subject';
import { GlobalLocationCapabilities } from './global-location.capabilities.interface';

@Injectable()
export class GlobalLocationCapabilityBuilder implements CapabilityBuilder<
  GlobalLocation,
  GlobalLocationCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: GlobalLocation,
    context: AuthorizationContext<Principal>,
  ): GlobalLocationCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const locationSubject = subject(GlobalLocationSubject, entity);

    return {
      canUpdate: ability.can(GlobalLocationAction.Update, locationSubject),
      canDelete: ability.can(GlobalLocationAction.Delete, locationSubject),
    };
  }
}
