import { TenantQueryRepository } from '../../../../infrastructure/repositories/tenant.query.repository';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantAuthorizationStrategy } from './interfaces/tenant-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../packages/authorization';
import { TenantAction } from '../../actions/tenant.action';
import { subject } from '@casl/ability';
import { TenantSubject } from '../../subjects/tenant.subject';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { ViewTenantPayload } from '../payloads/view-tenant.payload';

@Injectable()
export class ViewTenantStrategy implements TenantAuthorizationStrategy<ViewTenantPayload> {
  readonly action = TenantAction.View;
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly tenantQueryRepository: TenantQueryRepository,
  ) {}
  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ViewTenantPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.tenantId) {
      throw new BadRequestException('Tenant ID is required for authorization');
    }

    const entity = await this.tenantQueryRepository.findById(payload.tenantId);
    if (!entity) {
      throw new NotFoundException('Tenant not found');
    }

    if (!ability.can(TenantAction.View, subject(TenantSubject, entity))) {
      throw new AccessDeniedException();
    }
  }
}
