import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { DiscoveryService, Reflector } from '@nestjs/core';

import { CaslAbilityContributor } from '../contracts/CaslAbilityContributor';
import { CASL_CONTRIBUTOR_METADATA } from '../decorators/casl-contributor.decorator';
import { AnyAbility } from '@casl/ability';

@Injectable()
export class CaslContributorDiscovery implements OnApplicationBootstrap {
  private contributors: CaslAbilityContributor<AnyAbility>[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    this.contributors = [];

    const providers = this.discovery.getProviders();

    for (const provider of providers) {
      const { instance, metatype } = provider;

      if (!instance || !metatype) {
        continue;
      }

      const isContributor = this.reflector.get<boolean>(
        CASL_CONTRIBUTOR_METADATA,
        metatype,
      );

      if (!isContributor) {
        continue;
      }

      if (
        typeof (instance as { contribute?: unknown }).contribute !== 'function'
      ) {
        continue;
      }

      this.contributors.push(instance as CaslAbilityContributor);
    }
  }

  getContributors(): readonly CaslAbilityContributor[] {
    return this.contributors;
  }
}
