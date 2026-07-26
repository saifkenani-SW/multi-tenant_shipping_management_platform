import { Injectable } from '@nestjs/common';
import { TenantAuthorizationStrategy } from './interfaces/tenant-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { TenantAction } from '../../actions/tenant.action';
import { CreateTenantPayload } from '../payloads';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { TenantSubject } from '../../subjects/tenant.subject';

@Injectable()
export class CreateTenantStrategy implements TenantAuthorizationStrategy<CreateTenantPayload> {
  readonly action = TenantAction.Create;

  constructor(private readonly caslFactory: CaslAbilityBuilder<Principal>) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: CreateTenantPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(TenantAction.Create, TenantSubject)) {
      throw new AccessDeniedException();
    }
  }
}
