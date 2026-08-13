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
import { EmployeeFacade } from '../../../../employee/facades/employee.facade';
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
    private readonly employeeFacade: EmployeeFacade,
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
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @Transactional()
  async recordDelivery(
    trackingNumber: string,
    dto: RecordDeliveryDto,
    actor: { employeeId: string },
  ): Promise<{ id: string }> {
    // Resolve the tracking number to the aggregate carrying its optimistic-lock
    // version. The UUID is only used internally from this point onward.
    const parcel =
      await this.parcelQueryRepository.findAggregateByTrackingNumber(
        trackingNumber,
      );

    if (!parcel) {
      throw new ConflictException('Parcel not found.');
    }

    if (await this.queryRepository.existsForParcel(parcel.id)) {
      throw new ConflictException(
        'This parcel already has a proof of delivery.',
      );
    }

    // A parcel cannot be proven delivered before it is collectable.
    parcel.assertCollectable();

    const previousStatus = parcel.currentStatus;
    const alreadyCollected = parcel.isCollected();

    const created = await this.commandRepository.create({
      tenantId: parcel.tenantId,
      parcelId: parcel.id,
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
        parcel.id,
        parcel.currentStatus,
        parcel.version,
      );

      const movement: AppendParcelMovementCommand = {
        tenantId: parcel.tenantId,
        parcelId: parcel.id,
        performedByEmployeeId: actor.employeeId,
        actionType: ActionType.POD_COMPLETED,
        previousStatus,
        newStatus: parcel.currentStatus,
        previousCondition: parcel.currentCondition,
        newCondition: parcel.currentCondition,
        performedByName:
          (await this.employeeFacade.getEmployeeName(actor.employeeId)) ?? '',
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
