import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';

import { ParcelAction } from '../actions/parcel.action';
import { ParcelSubject } from '../subjects/parcel.subject';
import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { ParcelActionPayload } from './payloads/parcel-action.payload';
import { ParcelQueryRepository } from '../../../infrastructure/repositories/parcel.query.repository';

@Injectable()
export class ParcelPolicy implements AuthorizationPolicy<ParcelAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly queryRepository: ParcelQueryRepository,
  ) {}

  async authorize(
    action: ParcelAction,
    context: AuthorizationContext<Principal>,
    payload?: ParcelActionPayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (payload?.trackingNumber || payload?.id) {
      const entity = payload.trackingNumber
        ? await this.queryRepository.findAggregateByTrackingNumber(payload.trackingNumber)
        : await this.queryRepository.findAggregateById(payload.id!);

      if (!entity) {
        throw new NotFoundException('Parcel not found');
      }

      if (!ability.can(action, subject(ParcelSubject, entity))) {
        throw new AccessDeniedException();
      }

      return;
    }

    // Fallback for actions that don't operate on a specific entity
    if (!ability.can(action, ParcelSubject)) {
      throw new AccessDeniedException();
    }
  }
}
