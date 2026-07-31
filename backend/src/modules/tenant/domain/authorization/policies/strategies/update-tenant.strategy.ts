import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantAuthorizationStrategy } from './interfaces/tenant-authorization-strategy.interface';
import { TenantAction } from '../../actions/tenant.action';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../packages/authorization';
import { UpdateTenantPayload } from '../payloads';
import type { ITenantQueryRepository } from '../../../../application/interfaces/tenant.query.repository.interface';
import { TenantSubject } from '../../subjects/tenant.subject';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { subject } from '@casl/ability';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { TENANT_QUERY_REPOSITORY_TOKEN } from '../../../../tokens/tenant-repository.tokens';

@Injectable()
export class UpdateTenantStrategy implements TenantAuthorizationStrategy<UpdateTenantPayload> {
  readonly action = TenantAction.Update;
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(TENANT_QUERY_REPOSITORY_TOKEN)
    private readonly tenantQueryRepository: ITenantQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: UpdateTenantPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.tenantId) {
      throw new BadRequestException('Tenant ID is required for authorization');
    }

    const entity = await this.tenantQueryRepository.findById(payload.tenantId);
    if (!entity) {
      throw new NotFoundException('Tenant not found');
    }

    if (!ability.can(TenantAction.Update, subject(TenantSubject, entity))) {
      throw new AccessDeniedException();
    }
  }
}
