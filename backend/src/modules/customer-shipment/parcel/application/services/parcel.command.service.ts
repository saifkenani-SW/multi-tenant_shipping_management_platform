import { Injectable } from '@nestjs/common';
import { ActionType, ParcelCondition } from '@prisma/client';
import { Transactional } from '../../../../../packages/transaction';
import { Authorize } from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ParcelPolicy } from '../../domain/authorization/policies/parcel.policy';
import { ParcelAction } from '../../domain/authorization/actions/parcel.action';
import { TrackingFacade } from '../../../../tracking/application/facades/tracking.facade';
import { AppendParcelMovementCommand } from '../../../../tracking/application/commands/append-parcel-movement.command';
import { ParcelCommandRepository } from '../../infrastructure/repositories/parcel.command.repository';
import { ParcelQueryService } from './parcel.query.service';
import { UpdateParcelStatusDto } from '../dtos/requests/update-parcel-status.dto';
import { ShipmentStatusRecalculator } from '../../../shipment/application/services/shipment-status.recalculator';

@Injectable()
export class ParcelCommandService {
  constructor(
    private readonly commandRepository: ParcelCommandRepository,
    private readonly queryService: ParcelQueryService,
    private readonly trackingFacade: TrackingFacade,
    private readonly shipmentRecalculator: ShipmentStatusRecalculator,
  ) {}

  /**
   * Moves a parcel to a new status.
   *
   * Three things happen together or not at all: the parcel row is updated under
   * its optimistic lock, the movement is appended to the tracking history, and
   * the owning shipment status is re-derived. The tracking call is awaited
   * inside the transaction on purpose — a fire-and-forget would let a rolled
   * back status leave a movement behind.
   */
  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.UpdateStatus),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @Transactional()
  async updateStatus(
    trackingNumber: string,
    dto: UpdateParcelStatusDto,
    actor: { employeeId: string; employeeName: string },
  ): Promise<void> {
    const parcel = await this.queryService.findAggregateByTrackingNumberOrThrow(trackingNumber);

    const previousStatus = parcel.currentStatus;
    const previousCondition = parcel.currentCondition;

    // The aggregate decides whether the move is legal.
    parcel.transitionTo(dto.status);

    if (dto.condition) {
      parcel.changeCondition(dto.condition);
    }

    if (dto.organizationUnitId !== undefined) {
      parcel.moveTo(dto.organizationUnitId ?? null);
    }

    await this.commandRepository.updateStatus(
      parcel.id,
      parcel.currentStatus,
      parcel.version,
      {
        condition: dto.condition,
        currentOrgUnitId: parcel.currentOrgUnitId,
      },
    );

    const movement: AppendParcelMovementCommand = {
      tenantId: parcel.tenantId,
      parcelId: parcel.id,
      tripId: dto.tripId,
      organizationUnitId: dto.organizationUnitId,
      performedByEmployeeId: actor.employeeId,
      actionType: dto.actionType ?? ActionType.TRANSFERRED,
      previousStatus,
      newStatus: parcel.currentStatus,
      previousCondition,
      newCondition: dto.condition ?? parcel.currentCondition,
      performedByName: actor.employeeName,
      notes: dto.notes,
    };

    await this.trackingFacade.appendMovement(movement);

    // A parcel move can complete or advance the whole shipment.
    await this.shipmentRecalculator.recalculateFromParcels(
      parcel.customerShipmentId,
    );
  }

  /** Records the label produced for a parcel. Stores the key, never a URL. */
  async attachLabel(parcelId: string, labelKey: string): Promise<void> {
    await this.commandRepository.updateLabelKey(parcelId, labelKey);
  }

  /** Exposed for readability at call sites that only need the enum. */
  static readonly Condition = ParcelCondition;
}
