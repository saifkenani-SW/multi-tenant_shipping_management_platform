import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';

import { PodAction } from '../actions/pod.action';
import { PodSubject } from '../subjects/pod.subject';
import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { PodActionPayload } from './payloads/pod-action.payload';
import { ParcelQueryRepository } from '../../../../parcel/infrastructure/repositories/parcel.query.repository';

@Injectable()
export class PodPolicy implements AuthorizationPolicy<PodAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly queryRepository: ParcelQueryRepository,
  ) {}

  async authorize(
    action: PodAction,
    context: AuthorizationContext<Principal>,
    payload?: PodActionPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (payload?.trackingNumber) {
      const entity = await this.queryRepository.findRawByTrackingNumber(
        payload.trackingNumber,
      );

      if (!entity) {
        throw new NotFoundException('Parcel not found');
      }

      if (!ability.can(action, subject(PodSubject, entity))) {
        throw new AccessDeniedException();
      }

      return;
    }

    if (!ability.can(action, PodSubject)) {
      throw new AccessDeniedException();
    }
  }
}
