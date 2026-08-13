import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { ParcelAuthorizationStrategy } from './interfaces/parcel-authorization-strategy.interface';
import {
  AccessDeniedException,
  AuthorizationContext,
} from '../../../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../../../packages/authorization-casl';
import { Principal } from '../../../../../../../packages/context/principal/principal/Principal';
import { ParcelAction } from '../../actions/parcel.action';
import { ParcelSubject } from '../../subjects/parcel.subject';
import { ParcelActionPayload } from '../payloads/parcel-action.payload';
import { ParcelQueryRepository } from '../../../../infrastructure/repositories/parcel.query.repository';

@Injectable()
export class ViewParcelStrategy implements ParcelAuthorizationStrategy<ParcelActionPayload> {
  readonly action = ParcelAction.View;

  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    private readonly queryRepository: ParcelQueryRepository,
  ) {}

  async authorize(
    context: AuthorizationContext<Principal>,
    payload?: ParcelActionPayload,
  ): Promise<void> {
    if (!payload?.trackingNumber) {
      throw new BadRequestException('Tracking Number is required for authorization');
    }

    const entity = await this.queryRepository.findRawByTrackingNumber(payload.trackingNumber);
    if (!entity) {
      throw new NotFoundException('Parcel not found');
    }

    const ability = this.caslFactory.create(context.principal);

    if (!ability.can(ParcelAction.View, subject(ParcelSubject, entity))) {
      throw new AccessDeniedException();
    }
  }
}
