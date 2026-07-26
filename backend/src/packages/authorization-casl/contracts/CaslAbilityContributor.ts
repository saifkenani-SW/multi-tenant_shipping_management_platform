import { AbilityBuilder, AnyAbility } from '@casl/ability';

export interface CaslAbilityContributor<
  TAbility extends AnyAbility = AnyAbility,
  TPrincipal = unknown,
> {
  contribute(builder: AbilityBuilder<TAbility>, principal: TPrincipal): void;
}
