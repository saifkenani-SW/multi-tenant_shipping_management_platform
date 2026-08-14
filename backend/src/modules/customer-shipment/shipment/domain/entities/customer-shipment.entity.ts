import { ConflictException } from '@nestjs/common';
import { ParcelStatus, ShipmentStatus } from '@prisma/client';

export interface CustomerShipmentSnapshot {
  id: string;
  version: number;
  tenantId: string;
  senderName: string;
  senderPhone: string;
  senderNationalId: string | null;
  shipmentRequestId: string | null;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  serviceLevel: string;
  receiverName: string;
  receiverPhone: string;
  paymentResponsibility: string;
  totalChargeableWeightKg: number | null;
  status: ShipmentStatus;
  createdAt: Date;
  updatedAt: Date;
  createdByEmployeeId: string | null;
  createdByEmployeeName: string | null;
}

/**
 * Transitions the shipment lifecycle allows. Anything absent here is rejected.
 *
 * Note on naming: the plan refers to a parcel state `AT_DESTINATION`, which the
 * deployed ParcelStatus enum does not have — its equivalent is
 * READY_FOR_COLLECTION, and a delivered parcel is COLLECTED. This entity works
 * against the enum the database actually accepts.
 */
const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PENDING]: [
    ShipmentStatus.PROCESSING,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.PROCESSING]: [
    ShipmentStatus.READY_FOR_DISPATCH,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.READY_FOR_DISPATCH]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [
    ShipmentStatus.PROCESSING,
    ShipmentStatus.READY_FOR_COLLECTION,
    ShipmentStatus.RETURNED,
  ],
  [ShipmentStatus.READY_FOR_COLLECTION]: [ShipmentStatus.DELIVERED],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.CANCELLED]: [],
  [ShipmentStatus.RETURNED]: [],
};

/**
 * CustomerShipment aggregate root.
 *
 * Owns its own lifecycle: an application service requests a transition and the
 * aggregate decides whether it is legal, raising a domain exception when not.
 * Concurrency is guarded by `version` (optimistic locking) — the repository
 * writes only when the stored version still matches the one read.
 */
export class CustomerShipment {
  private constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly tenantId: string,
    public readonly senderName: string,
    public readonly senderPhone: string,
    public readonly senderNationalId: string | null,
    public readonly shipmentRequestId: string | null,
    public readonly originOrgUnitId: string,
    public readonly destinationOrgUnitId: string,
    public readonly serviceLevel: string,
    public readonly receiverName: string,
    public readonly receiverPhone: string,
    public readonly paymentResponsibility: string,
    public readonly totalChargeableWeightKg: number | null,
    private _status: ShipmentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdByEmployeeId: string | null,
    public readonly createdByEmployeeName: string | null,
  ) {}

  get status(): ShipmentStatus {
    return this._status;
  }

  static restore(snapshot: CustomerShipmentSnapshot): CustomerShipment {
    return new CustomerShipment(
      snapshot.id,
      snapshot.version,
      snapshot.tenantId,
      snapshot.senderName,
      snapshot.senderPhone,
      snapshot.senderNationalId,
      snapshot.shipmentRequestId,
      snapshot.originOrgUnitId,
      snapshot.destinationOrgUnitId,
      snapshot.serviceLevel,
      snapshot.receiverName,
      snapshot.receiverPhone,
      snapshot.paymentResponsibility,
      snapshot.totalChargeableWeightKg,
      snapshot.status,
      snapshot.createdAt,
      snapshot.updatedAt,
      snapshot.createdByEmployeeId,
      snapshot.createdByEmployeeName,
    );
  }

  /** Applies a transition after checking it is permitted from the current state. */
  transitionTo(target: ShipmentStatus): void {
    if (target === this._status) {
      return;
    }

    if (!ALLOWED_TRANSITIONS[this._status].includes(target)) {
      throw new ConflictException(
        `Shipment cannot move from ${this._status} to ${target}.`,
      );
    }

    this._status = target;
  }

  /** PENDING or PROCESSING -> CANCELLED. Never after dispatch. */
  cancel(): void {
    this.transitionTo(ShipmentStatus.CANCELLED);
  }

  /**
   * Derives the shipment status from the state of all its parcels, and returns
   * the new status when it changed — the caller then persists it and emits the
   * matching event.
   *
   * Cancelled and returned parcels are ignored: a shipment is judged by the
   * parcels still travelling. A shipment whose parcels are all cancelled stays
   * where it is and is cancelled explicitly instead.
   */
  recalculateStatus(parcelStatuses: ParcelStatus[]): ShipmentStatus | null {
    const live = parcelStatuses.filter(
      (status) =>
        status !== ParcelStatus.CANCELLED && status !== ParcelStatus.RETURNED,
    );

    if (live.length === 0) {
      return null;
    }

    const every = (status: ParcelStatus) => live.every((s) => s === status);
    const some = (status: ParcelStatus) => live.some((s) => s === status);

    let target: ShipmentStatus | null = null;

    if (every(ParcelStatus.COLLECTED)) {
      target = ShipmentStatus.DELIVERED;
    } else if (every(ParcelStatus.READY_FOR_COLLECTION)) {
      target = ShipmentStatus.READY_FOR_COLLECTION;
    } else if (some(ParcelStatus.IN_TRANSIT)) {
      target = ShipmentStatus.IN_TRANSIT;
    } else if (every(ParcelStatus.READY_FOR_DISPATCH)) {
      target = ShipmentStatus.READY_FOR_DISPATCH;
    }

    if (!target || target === this._status) {
      return null;
    }

    // A derived status must still respect the lifecycle. An out-of-order
    // parcel scan must not drag a shipment backwards.
    if (!ALLOWED_TRANSITIONS[this._status].includes(target)) {
      return null;
    }

    this._status = target;
    return target;
  }

  isCancellable(): boolean {
    return ALLOWED_TRANSITIONS[this._status].includes(ShipmentStatus.CANCELLED);
  }
}
