import { DynamicModule, Module, Provider, Type } from '@nestjs/common';

import { DiscoveryModule } from '@nestjs/core';

import { CaslAbilityContributor } from '../contracts/CaslAbilityContributor';
import { CaslAbilityBuilder } from '../factories/CaslAbilityBuilder';
import { CaslContributorDiscovery } from '../discovery/CaslContributorDiscovery';

@Module({})
export class CaslModule {
  static forRoot(): DynamicModule {
    return {
      global: true,

      module: CaslModule,

      imports: [DiscoveryModule],

      providers: [CaslContributorDiscovery, CaslAbilityBuilder],

      exports: [CaslAbilityBuilder],
    };
  }

  static forFeature(
    contributors: Type<CaslAbilityContributor>[],
  ): DynamicModule {
    const providers: Provider[] = contributors;

    return {
      module: CaslModule,

      providers,

      exports: providers,
    };
  }
}
