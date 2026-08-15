import { Inject, Injectable } from '@nestjs/common';
import {
  ActionType,
  OrgType,
  ParcelCondition,
  ParcelStatus,
} from '@prisma/client';
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
import { RecordDeliveryDto } from '../../../proof-of-delivery/application/dtos/requests/record-delivery.dto';
import { ProofOfDeliveryCommandService } from '../../../proof-of-delivery/application/services/proof-of-delivery.command.service';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { EmployeeFacade } from '../../../../employee/facades/employee.facade';
import { CUSTOMER_SHIPMENT_CACHE_KEYS } from '../../../constants/customer-shipment.cache.constants';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import type { ICacheFacade } from '../../../../../core/cache/interfaces/ICacheFacade';
import { CACHE_FACADE } from '../../../../../core/cache/tokens/cache.tokens';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';

@Injectable()
export class ParcelCommandService {
  constructor(
    private readonly commandRepository: ParcelCommandRepository,
    private readonly queryService: ParcelQueryService,
    private readonly trackingFacade: TrackingFacade,
    private readonly shipmentRecalculator: ShipmentStatusRecalculator,
    private readonly podCommandService: ProofOfDeliveryCommandService,
    private readonly requestContext: RequestContextService,
    private readonly employeeFacade: EmployeeFacade,
    @Inject(CACHE_FACADE)
    private readonly cache: ICacheFacade,
    private readonly organizationFacade: OrganizationFacade,
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
    policy: Policy(ParcelPolicy, ParcelAction.Receive),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })
  async receiveParcel(trackingNumber: string): Promise<void> {
    const parcel =
      await this.queryService.findAggregateByTrackingNumberOrThrow(
        trackingNumber,
      );

    await this._applyAndPersistUpdate(
      parcel,
      trackingNumber,
      ActionType.RECEIVED_AT_BRANCH,
      (p) => p.receive(),
    );
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.Dispatch),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })
  async markReadyForDispatch(trackingNumber: string): Promise<void> {
    const parcel =
      await this.queryService.findAggregateByTrackingNumberOrThrow(
        trackingNumber,
      );

    await this._applyAndPersistUpdate(
      parcel,
      trackingNumber,
      ActionType.TRANSFERRED,
      (p) => p.markReadyForDispatch(),
    );
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.UpdateStatus),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })
  async updateStatus(
    trackingNumber: string,
    dto: UpdateParcelStatusDto,
  ): Promise<void> {
    const parcel =
      await this.queryService.findAggregateByTrackingNumberOrThrow(
        trackingNumber,
      );

    // Fallback logic for generic status update if it wasn't mapped through a specialized method
    let actionType: ActionType = ActionType.TRANSFERRED;
    if (dto.status === ParcelStatus.COLLECTED)
      actionType = ActionType.COLLECTED;
    else if (dto.status === ParcelStatus.RETURNED)
      actionType = ActionType.RETURN_COMPLETED;
    else if (dto.status === ParcelStatus.CANCELLED)
      actionType = ActionType.CANCELLED;

    await this._applyAndPersistUpdate(
      parcel,
      trackingNumber,
      actionType,
      (p) => {
        if (dto.status) p.transitionTo(dto.status);
      },
      { condition: dto.condition, notes: dto.notes },
    );
  }

  /**
   * Called by the Fleet module (via ParcelFacade) when a driver picks up a parcel.
   * Bypasses ParcelPolicy since Fleet validates driver authorization.
   */
  @CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })
  async pickUpParcel(parcelId: string, tripId: string): Promise<void> {
    const parcel = await this.queryService.findAggregateOrThrow(parcelId);

    await this._applyAndPersistUpdate(
      parcel,
      parcel.trackingNumber,
      ActionType.LOADED_ON_TRIP,
      (p) => p.transitionTo(ParcelStatus.IN_TRANSIT),
      { tripId, notes: 'Parcel loaded on trip' },
    );
  }

  /**
   * Called by the Fleet module (via ParcelFacade) when a driver drops off a parcel.
   * Bypasses ParcelPolicy since Fleet validates driver authorization.
   */
  @CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })
  async dropOffParcel(
    parcelId: string,
    orgUnitId: string,
    tripId?: string,
  ): Promise<void> {
    const parcel = await this.queryService.findAggregateOrThrow(parcelId);

    await this._applyAndPersistUpdate(
      parcel,
      parcel.trackingNumber,
      ActionType.TRANSFERRED,
      (p) => p.transitionTo(ParcelStatus.ARRIVED_AT_UNIT),
      {
        organizationUnitId: orgUnitId,
        tripId,
        notes: 'Parcel dropped off at unit',
      },
    );
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.Collect),
    payloadResolver: (trackingNumber: string) => ({ trackingNumber }),
  })
  @CacheEvict({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async recordDelivery(
    trackingNumber: string,
    dto: RecordDeliveryDto,
    files: {
      signature?: any[];
      idPhoto?: any[];
      parcelPhoto?: any[];
      additionalPhoto?: any[];
    },
  ): Promise<{ id: string }> {
    const principal = this.requestContext.getPrincipal();
    const employeeId = principal.profileId ?? principal.subject.id;

    return this.podCommandService.recordDelivery(
      trackingNumber,
      dto,
      files,
      employeeId,
    );
  }

  @Transactional()
  private async _applyAndPersistUpdate(
    parcel: any,
    trackingNumber: string,
    actionType: ActionType,
    updateFn: (parcel: any) => void,
    options?: {
      condition?: ParcelCondition;
      organizationUnitId?: string;
      tripId?: string;
      notes?: string;
    },
  ): Promise<void> {
    const principal = this.requestContext.getPrincipal();
    const employeeId = principal.profileId ?? principal.subject.id ?? 'system';

    let employeeName = 'system';
    if (principal.profileId) {
      employeeName =
        (await this.employeeFacade.getEmployeeName(principal.profileId)) ||
        'system';
    }

    const previousStatus = parcel.currentStatus;
    const previousCondition = parcel.currentCondition;

    // Apply the main state change logic
    updateFn(parcel);

    // Apply any explicit options updates (e.g. from Fleet or manual updateStatus)
    if (options?.condition) {
      parcel.changeCondition(options.condition);
    }

    if (options?.organizationUnitId !== undefined) {
      parcel.moveTo(options.organizationUnitId);
    }

    await this.commandRepository.updateStatus(
      parcel.id,
      parcel.currentStatus,
      parcel.version,
      {
        condition: options?.condition,
        currentOrgUnitId: parcel.currentOrgUnitId,
      },
    );

    const effectiveOrgUnitId =
      options?.organizationUnitId ?? parcel.currentOrgUnitId;
    let organizationUnitName: string | undefined;
    let organizationType: OrgType | undefined;
    let organizationLatitude: number | undefined;
    let organizationLongitude: number | undefined;

    if (effectiveOrgUnitId) {
      const orgUnits = await this.organizationFacade.getOrganizationUnitsByIds([
        effectiveOrgUnitId,
      ]);
      if (orgUnits.length > 0) {
        const orgUnit = orgUnits[0];
        organizationUnitName = orgUnit.name;
        organizationType = orgUnit.orgType as unknown as OrgType;
        organizationLatitude = orgUnit.location?.latitude;
        organizationLongitude = orgUnit.location?.longitude;
      }
    }

    const movement: AppendParcelMovementCommand = {
      tenantId: parcel.tenantId,
      parcelId: parcel.id,
      tripId: options?.tripId,
      organizationUnitId: effectiveOrgUnitId,
      organizationUnitName,
      organizationType,
      organizationLatitude,
      organizationLongitude,
      performedByEmployeeId: employeeId,
      actionType: actionType,
      previousStatus,
      newStatus: parcel.currentStatus,
      previousCondition,
      newCondition: options?.condition ?? parcel.currentCondition,
      performedByName: employeeName,
      notes: options?.notes,
    };

    await this.trackingFacade.appendMovement(movement);

    // A parcel move can complete or advance the whole shipment.
    await this.shipmentRecalculator.recalculateFromParcels(
      parcel.customerShipmentId,
    );

    // Evict specific details since trackingNumber argument isn't enough for the decorator
    await Promise.all([
      this.cache.evict([
        CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
        parcel.id,
      ]),
      this.cache.evict([
        CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
        trackingNumber,
      ]),
      this.cache.evict([
        CUSTOMER_SHIPMENT_CACHE_KEYS.DETAILS,
        parcel.customerShipmentId,
      ]),
    ]);
  }

  /** Records the label produced for a parcel. Stores the key, never a URL. */
  @CacheEvict({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
    keyBuilder: (parcelId: string) => [
      CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_DETAILS,
      parcelId,
    ],
  })
  async attachLabel(parcelId: string, labelKey: string): Promise<void> {
    await this.commandRepository.updateLabelKey(parcelId, labelKey);
  }

  /** Exposed for readability at call sites that only need the enum. */
  static readonly Condition = ParcelCondition;
}
