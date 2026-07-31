import { Injectable } from '@nestjs/common';
import { TenantAuthorizationStrategy } from './interfaces/tenant-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../packages/authorization';
import { TenantAction } from '../../actions/tenant.action';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { TenantSubject } from '../../subjects/tenant.subject';

@Injectable()
export class ManageSubscriptionStrategy implements TenantAuthorizationStrategy<void> {
  readonly action = TenantAction.ManageSubscription;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: void,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(TenantAction.ManageSubscription, TenantSubject)) {
      throw new AccessDeniedException();
    }
  }
}
