import { Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  CapabilityBuilder,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { ParcelAction } from '../../domain/authorization/actions/parcel.action';
import { ParcelSubject } from '../../domain/authorization/subjects/parcel.subject';
import { ParcelTrackingResponseDto } from '../dtos/responses/parcel-tracking.response.dto';
import { ParcelCapabilities } from './parcel.capabilities.interface';
import { ParcelStatus } from '@prisma/client';

@Injectable()
export class ParcelCapabilityBuilder implements CapabilityBuilder<
  ParcelTrackingResponseDto,
  ParcelCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: ParcelTrackingResponseDto,
    context: AuthorizationContext<Principal>,
  ): ParcelCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const parcelSubject = subject(ParcelSubject, entity);

    return {
      canView: ability.can(ParcelAction.View, parcelSubject),
      canUpdateStatus: ability.can(ParcelAction.UpdateStatus, parcelSubject),
      canReceive:
        ability.can(ParcelAction.Receive, parcelSubject) &&
        entity.currentStatus === ParcelStatus.ARRIVED_AT_UNIT,
      canDispatch:
        ability.can(ParcelAction.Dispatch, parcelSubject) &&
        entity.currentStatus === ParcelStatus.PROCESSING,
      canCollect:
        ability.can(ParcelAction.Collect, parcelSubject) &&
        entity.currentStatus === ParcelStatus.READY_FOR_COLLECTION,
      canDeliver:
        ability.can(ParcelAction.Collect, parcelSubject) &&
        entity.currentStatus === ParcelStatus.IN_TRANSIT, // Deliver uses collect permission logically, but must be in transit
    };
  }
}
