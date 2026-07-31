import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import type { ITenantQueryRepository } from '../../../../application/interfaces/tenant.query.repository.interface';
import { TENANT_QUERY_REPOSITORY_TOKEN } from '../../../../tokens/tenant-repository.tokens';
import { TenantAction } from '../../actions/tenant.action';
import { TenantAuthorizationStrategy } from './interfaces/tenant-authorization-strategy.interface';
import { ActivateTenantPayload } from '../payloads';
import { TenantSubject } from '../../subjects/tenant.subject';

@Injectable()
export class ActivateTenantStrategy implements TenantAuthorizationStrategy<ActivateTenantPayload> {
  readonly action = TenantAction.Activate;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(TENANT_QUERY_REPOSITORY_TOKEN)
    private readonly tenantQueryRepository: ITenantQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ActivateTenantPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.tenantId) {
      throw new BadRequestException('Tenant ID is required for authorization');
    }

    const entity = await this.tenantQueryRepository.findById(payload.tenantId);
    if (!entity) {
      throw new NotFoundException('Tenant not found');
    }

    if (!ability.can(TenantAction.Activate, subject(TenantSubject, entity))) {
      throw new AccessDeniedException();
    }
  }
}
