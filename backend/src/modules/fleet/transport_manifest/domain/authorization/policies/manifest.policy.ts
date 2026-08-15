import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ManifestAction } from '../actions/manifest.action';
import { ManifestSubject } from '../subjects/manifest.subject';
import { TransportManifestQueryRepository } from '../../../infrastructure/repositories/transport-manifest-query.repository';
import { ManifestActionPayload } from './payloads/manifest-action.payload';
import { subject } from '@casl/ability';

@Injectable()
export class ManifestPolicy implements AuthorizationPolicy<ManifestAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly queryRepository: TransportManifestQueryRepository,
  ) {}

  async authorize(
    action: ManifestAction,
    context: AuthorizationContext<Principal>,
    payload?: ManifestActionPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (payload?.id) {
      const entity = await this.queryRepository.findRawById(payload.id);

      if (!entity) {
        throw new NotFoundException('Manifest not found');
      }

      if (!ability.can(action, subject(ManifestSubject, entity))) {
        throw new AccessDeniedException();
      }

      return;
    }

    if (!ability.can(action, ManifestSubject)) {
      throw new AccessDeniedException();
    }
  }
}
