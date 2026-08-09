import { ConflictException, Injectable } from '@nestjs/common';
import { ActionType, CollectionMethod, ParcelStatus } from '@prisma/client';
import { Transactional } from '../../../../../packages/transaction';
import { Authorize } from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { PodPolicy } from '../../domain/authorization/policies/pod.policy';
import { PodAction } from '../../domain/authorization/actions/pod.action';
import { TrackingFacade } from '../../../../tracking/application/facades/tracking.facade';
import { AppendParcelMovementCommand } from '../../../../tracking/application/commands/append-parcel-movement.command';
import { ProofOfDeliveryCommandRepository } from '../../infrastructure/repositories/proof-of-delivery.command.repository';
import { ProofOfDeliveryQueryRepository } from '../../infrastructure/repositories/proof-of-delivery.query.repository';
import { ParcelQueryRepository } from '../../../parcel/infrastructure/repositories/parcel.query.repository';
import { ParcelCommandRepository } from '../../../parcel/infrastructure/repositories/parcel.command.repository';
import { ShipmentStatusRecalculator } from '../../../shipment/application/services/shipment-status.recalculator';
import { RecordDeliveryDto } from '../dtos/requests/record-delivery.dto';

@Injectable()
export class ProofOfDeliveryCommandService {
  constructor(
    private readonly commandRepository: ProofOfDeliveryCommandRepository,
    private readonly queryRepository: ProofOfDeliveryQueryRepository,
    private readonly parcelQueryRepository: ParcelQueryRepository,
    private readonly parcelCommandRepository: ParcelCommandRepository,
    private readonly trackingFacade: TrackingFacade,
    private readonly shipmentRecalculator: ShipmentStatusRecalculator,
  ) {}

  /**
   * Records the delivery of one parcel.
   *
   * Four things commit together: the proof row, the parcel moving to COLLECTED
   * under its optimistic lock, the movement appended to the tracking history,
   * and the owning shipment status re-derived. A proof exists at most once per
   * parcel, enforced both here and by a unique constraint.
   */
  @Authorize({
    policy: Policy(PodPolicy, PodAction.Record),
    payloadResolver: (parcelId: string) => ({ parcelId }),
  })
  @Transactional()
  async recordDelivery(
    parcelId: string,
    dto: RecordDeliveryDto,
    actor: { employeeId: string; employeeName: string },
  ): Promise<{ id: string }> {
    if (await this.queryRepository.existsForParcel(parcelId)) {
      throw new ConflictException(
        'This parcel already has a proof of delivery.',
      );
    }

    const parcel = await this.parcelQueryRepository.findAggregateById(parcelId);

    if (!parcel) {
      throw new ConflictException('Parcel not found.');
    }

    // A parcel cannot be proven delivered before it is collectable.
    parcel.assertCollectable();

    const previousStatus = parcel.currentStatus;
    const alreadyCollected = parcel.isCollected();

    const created = await this.commandRepository.create({
      tenantId: parcel.tenantId,
      parcelId,
      deliveredByEmployeeId: actor.employeeId,
      collectionMethod: dto.collectionMethod ?? CollectionMethod.CUSTOMER,
      receivedByName: dto.receivedByName,
      receivedByNationalId: dto.receivedByNationalId ?? null,
      otpVerified: dto.otpVerified ?? false,
      otpVerifiedAt: dto.otpVerified ? new Date() : null,
      signatureKey: dto.signatureKey ?? null,
      idPhotoKey: dto.idPhotoKey ?? null,
      parcelPhotoKey: dto.parcelPhotoKey ?? null,
      additionalPhotoKey: dto.additionalPhotoKey ?? null,
      deliveryLat: dto.deliveryLat ?? null,
      deliveryLng: dto.deliveryLng ?? null,
    });

    // Recording proof for an already-collected parcel is legitimate catch-up
    // paperwork; only move the parcel when it has not moved yet.
    if (!alreadyCollected) {
      parcel.transitionTo(ParcelStatus.COLLECTED);

      await this.parcelCommandRepository.updateStatus(
        parcelId,
        parcel.currentStatus,
        parcel.version,
      );

      const movement: AppendParcelMovementCommand = {
        tenantId: parcel.tenantId,
        parcelId,
        performedByEmployeeId: actor.employeeId,
        actionType: ActionType.POD_COMPLETED,
        previousStatus,
        newStatus: parcel.currentStatus,
        previousCondition: parcel.currentCondition,
        newCondition: parcel.currentCondition,
        performedByName: actor.employeeName,
        notes: `Received by ${dto.receivedByName}`,
      };

      await this.trackingFacade.appendMovement(movement);

      await this.shipmentRecalculator.recalculateFromParcels(
        parcel.customerShipmentId,
      );
    }

    return created;
  }
}
