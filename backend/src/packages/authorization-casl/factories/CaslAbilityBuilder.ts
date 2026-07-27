import { AbilityBuilder, createMongoAbility } from '@casl/ability';

import { Injectable } from '@nestjs/common';

import { AppAbility } from '../types/app-ability';
import { CaslContributorDiscovery } from '../discovery/CaslContributorDiscovery';

@Injectable()
export class CaslAbilityBuilder<TPrincipal = unknown> {
  constructor(private readonly discovery: CaslContributorDiscovery) {}

  create(principal: TPrincipal): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

    for (const contributor of this.discovery.getContributors()) {
      contributor.contribute(builder, principal);
    }

    return builder.build();
  }
}
