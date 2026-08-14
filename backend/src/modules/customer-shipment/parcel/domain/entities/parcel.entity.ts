import { ConflictException } from '@nestjs/common';
import { ParcelCondition, ParcelStatus } from '@prisma/client';

export interface ParcelSnapshot {
  id: string;
  version: number;
  tenantId: string;
  customerShipmentId: string;
  trackingNumber: string;
  currentStatus: ParcelStatus;
  currentCondition: ParcelCondition;
  currentOrgUnitId: string | null;
  destinationOrgUnitId: string | null;
  labelKey: string | null;

  // Transient properties joined from customer_shipment for CASL authorization
  senderPhone?: string;
  receiverPhone?: string;
  originOrgUnitId?: string;
}

/**
 * Transitions the parcel lifecycle allows.
 *
 * The plan refers to a state `AT_DESTINATION`; the deployed ParcelStatus enum
 * has no such value. Its equivalent is READY_FOR_COLLECTION, and a parcel that
 * reached the customer is COLLECTED. This map follows the enum the database
 * accepts.
 */
const ALLOWED_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.PROCESSING]: [
    ParcelStatus.READY_FOR_DISPATCH,
    ParcelStatus.RETURNED,
  ],
  [ParcelStatus.READY_FOR_DISPATCH]: [
    ParcelStatus.IN_TRANSIT,
  ],
  [ParcelStatus.IN_TRANSIT]: [
    ParcelStatus.ARRIVED_AT_UNIT,
  ],
  [ParcelStatus.ARRIVED_AT_UNIT]: [
    ParcelStatus.PROCESSING,
    ParcelStatus.READY_FOR_COLLECTION,
  ],
  [ParcelStatus.READY_FOR_COLLECTION]: [
    ParcelStatus.COLLECTED,
  ],
  [ParcelStatus.COLLECTED]: [],
  [ParcelStatus.RETURNED]: [],
  [ParcelStatus.CANCELLED]: [],
};

/**
 * Parcel aggregate.
 *
 * Guards its own lifecycle and carries the `version` used for optimistic
 * locking: the repository writes only while the stored version still matches.
 */
export class Parcel {
  private constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly tenantId: string,
    public readonly customerShipmentId: string,
    public readonly trackingNumber: string,
    private _currentStatus: ParcelStatus,
    private _currentCondition: ParcelCondition,
    private _currentOrgUnitId: string | null,
    public readonly destinationOrgUnitId: string | null,
    public readonly labelKey: string | null,
    public readonly senderPhone?: string,
    public readonly receiverPhone?: string,
    public readonly originOrgUnitId?: string,
  ) {}

  get currentStatus(): ParcelStatus {
    return this._currentStatus;
  }

  get currentCondition(): ParcelCondition {
    return this._currentCondition;
  }

  get currentOrgUnitId(): string | null {
    return this._currentOrgUnitId;
  }

  get isFinalDestination(): boolean {
    return this._currentOrgUnitId === this.destinationOrgUnitId;
  }

  static restore(snapshot: ParcelSnapshot): Parcel {
    return new Parcel(
      snapshot.id,
      snapshot.version,
      snapshot.tenantId,
      snapshot.customerShipmentId,
      snapshot.trackingNumber,
      snapshot.currentStatus,
      snapshot.currentCondition,
      snapshot.currentOrgUnitId,
      snapshot.destinationOrgUnitId,
      snapshot.labelKey,
      snapshot.senderPhone,
      snapshot.receiverPhone,
      snapshot.originOrgUnitId,
    );
  }

  /** Applies a status transition after checking it is permitted. */
  transitionTo(target: ParcelStatus): void {
    if (target === this._currentStatus) {
      throw new ConflictException(`Parcel is already ${target}.`);
    }

    if (!ALLOWED_TRANSITIONS[this._currentStatus].includes(target)) {
      throw new ConflictException(
        `Parcel cannot move from ${this._currentStatus} to ${target}.`,
      );
    }

    this._currentStatus = target;
  }

  receive(): void {
    if (this._currentStatus !== ParcelStatus.ARRIVED_AT_UNIT) {
      throw new ConflictException('Parcel must be ARRIVED_AT_UNIT to be received.');
    }
    const nextStatus = this.isFinalDestination
      ? ParcelStatus.READY_FOR_COLLECTION
      : ParcelStatus.PROCESSING;
    this.transitionTo(nextStatus);
  }

  markReadyForDispatch(): void {
    if (this._currentStatus !== ParcelStatus.PROCESSING) {
      throw new ConflictException('Parcel must be PROCESSING to be dispatched.');
    }
    this.transitionTo(ParcelStatus.READY_FOR_DISPATCH);
  }

  /**
   * Condition is independent of the lifecycle: a damaged parcel keeps moving.
   * Changing it never alters the status.
   */
  changeCondition(condition: ParcelCondition): void {
    this._currentCondition = condition;
  }

  moveTo(orgUnitId: string | null): void {
    this._currentOrgUnitId = orgUnitId;
  }

  /** A proof of delivery may only be recorded once the parcel is collectable. */
  assertCollectable(): void {
    if (
      this._currentStatus !== ParcelStatus.READY_FOR_COLLECTION &&
      this._currentStatus !== ParcelStatus.COLLECTED
    ) {
      throw new ConflictException(
        `Proof of delivery requires the parcel to be READY_FOR_COLLECTION, but it is ${this._currentStatus}.`,
      );
    }
  }

  isCollected(): boolean {
    return this._currentStatus === ParcelStatus.COLLECTED;
  }
}
