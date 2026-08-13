import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { PodAuthorizationStrategy } from './interfaces/pod-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../../packages/context/principal/principal/Principal';
import { PodAction } from '../../actions/pod.action';
import { PodSubject } from '../../subjects/pod.subject';
import { PodActionPayload } from '../payloads/pod-action.payload';
import { ParcelQueryRepository } from '../../../../../parcel/infrastructure/repositories/parcel.query.repository';

/**
 * No proof exists yet when recording one, so the ability is checked against the
 * parcel it will belong to.
 */
@Injectable()
export class RecordPodStrategy implements PodAuthorizationStrategy<PodActionPayload> {
  readonly action = PodAction.Record;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly parcelQueryRepository: ParcelQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: PodActionPayload,
  ): Promise<void> {
    if (!payload?.trackingNumber) {
      throw new BadRequestException('Tracking Number is required for authorization.');
    }

    const parcel = await this.parcelQueryRepository.findAggregateByTrackingNumber(
      payload.trackingNumber,
    );

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(PodAction.Record, subject(PodSubject, parcel))) {
      throw new AccessDeniedException();
    }
  }
}
