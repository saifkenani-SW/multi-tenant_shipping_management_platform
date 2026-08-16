import { ManifestStatus } from '../enums/manifest-status.enum';
import { InvalidManifestRouteException } from '../exceptions/invalid-manifest-route.exception';
import { ManifestNotModifiableException } from '../exceptions/manifest-not-modifiable.exception';
import { ManifestNotReopenableException } from '../exceptions/manifest-not-reopenable.exception';

export interface TransportManifestSnapshot {
  id: string;
  tenantId: string;
  tripId: string | null;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  status: ManifestStatus;
  createdByEmployeeId: string | null;
  createdByEmployeeName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ManifestTransition = {
  from: ManifestStatus;
  to: ManifestStatus;
};

const ALLOWED_TRANSITIONS: ManifestTransition[] = [
  // 1. Finalize
  { from: ManifestStatus.OPEN, to: ManifestStatus.READY_FOR_DISPATCH },
  // 2. Fleet Books
  { from: ManifestStatus.READY_FOR_DISPATCH, to: ManifestStatus.ASSIGNED },
  // 3a. Driver scans first parcel
  { from: ManifestStatus.ASSIGNED, to: ManifestStatus.LOADING },
  // 3b. Driver scans last parcel (no more PENDING_LOAD)
  { from: ManifestStatus.LOADING, to: ManifestStatus.IN_TRANSIT },
  // 4. Driver unloads last parcel at destination
  { from: ManifestStatus.IN_TRANSIT, to: ManifestStatus.COMPLETED },
  // 5. Revert/Reopen
  { from: ManifestStatus.READY_FOR_DISPATCH, to: ManifestStatus.OPEN },
];

/**
 * TransportManifest aggregate root.
 *
 * Lifecycle: OPEN → READY_FOR_DISPATCH → ASSIGNED → LOADING → IN_TRANSIT → COMPLETED
 *
 * A manifest is created standalone (OPEN, no trip). An employee assembles
 * parcels on it and calls finalize() to signal it is ready for dispatch.
 * Fleet assigns it to a trip (ASSIGNED). The driver then scans parcels:
 *   - First scan  → LOADING
 *   - Last scan   → IN_TRANSIT (all parcels on board)
 * When the driver unloads the last parcel at the destination → COMPLETED.
 */
export class TransportManifest {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _tripId: string | null,
    public readonly originOrgUnitId: string,
    public readonly destinationOrgUnitId: string,
    private _status: ManifestStatus,
    public readonly createdByEmployeeId: string | null,
    public readonly createdByEmployeeName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get status(): ManifestStatus {
    return this._status;
  }

  get tripId(): string | null {
    return this._tripId;
  }

  static create(props: {
    tenantId: string;
    originOrgUnitId: string;
    destinationOrgUnitId: string;
    createdByEmployeeId?: string | null;
    createdByEmployeeName?: string | null;
  }): TransportManifest {
    TransportManifest.assertRouteIsValid(
      props.originOrgUnitId,
      props.destinationOrgUnitId,
    );

    const now = new Date();

    return new TransportManifest(
      '',
      props.tenantId,
      null,
      props.originOrgUnitId,
      props.destinationOrgUnitId,
      ManifestStatus.OPEN,
      props.createdByEmployeeId ?? null,
      props.createdByEmployeeName ?? null,
      now,
      now,
    );
  }

  static restore(snapshot: TransportManifestSnapshot): TransportManifest {
    return new TransportManifest(
      snapshot.id,
      snapshot.tenantId,
      snapshot.tripId,
      snapshot.originOrgUnitId,
      snapshot.destinationOrgUnitId,
      snapshot.status,
      snapshot.createdByEmployeeId,
      snapshot.createdByEmployeeName,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  static assertRouteIsValid(
    originOrgUnitId: string,
    destinationOrgUnitId: string,
  ): void {
    if (originOrgUnitId === destinationOrgUnitId) {
      throw new InvalidManifestRouteException();
    }
  }

  private transitionTo(newStatus: ManifestStatus): void {
    const isValid = ALLOWED_TRANSITIONS.some(
      (t) => t.from === this._status && t.to === newStatus,
    );
    if (!isValid) {
      throw new ManifestNotModifiableException(
        `Invalid transition from ${this._status} to ${newStatus}`,
      );
    }
    this._status = newStatus;
  }

  /**
   * Parcels may only be added or removed while the manifest is OPEN.
   * Once finalised the parcel list is frozen until the manifest is reopened.
   */
  assertItemsModifiable(): void {
    if (this._status !== ManifestStatus.OPEN) {
      throw new ManifestNotModifiableException();
    }
  }

  /**
   * OPEN → READY_FOR_DISPATCH.
   * The service must verify that at least one item exists before calling this.
   */
  finalize(): void {
    this.transitionTo(ManifestStatus.READY_FOR_DISPATCH);
  }

  /**
   * READY_FOR_DISPATCH → OPEN.
   * Only allowed while no trip has claimed this manifest yet.
   */
  reopen(): void {
    if (this._tripId !== null) {
      throw new ManifestNotReopenableException();
    }
    this.transitionTo(ManifestStatus.OPEN);
  }

  /**
   * READY_FOR_DISPATCH → ASSIGNED.
   * Called when a dispatcher assigns this available manifest to a scheduled trip.
   */
  assignToTrip(tripId: string): void {
    if (this._tripId !== null) {
      throw new ManifestNotModifiableException(
        'Manifest is already assigned to a trip',
      );
    }
    this.transitionTo(ManifestStatus.ASSIGNED);
    this._tripId = tripId;
  }

  /**
   * ASSIGNED → LOADING.
   * Called when the driver scans the first parcel onto the vehicle.
   */
  startLoading(): void {
    this.transitionTo(ManifestStatus.LOADING);
  }

  /**
   * LOADING → IN_TRANSIT.
   * Called when all PENDING_LOAD items have been scanned (none remain).
   */
  completeLoading(): void {
    this.transitionTo(ManifestStatus.IN_TRANSIT);
  }

  /**
   * IN_TRANSIT → COMPLETED.
   * Called when the last LOADED item has been unloaded at the destination.
   */
  markCompleted(): void {
    this.transitionTo(ManifestStatus.COMPLETED);
  }

  /**
   * Guard: ensures updateItemStatus is only called in a valid manifest state.
   * - LOADED action: manifest must be ASSIGNED or LOADING.
   * - UNLOADED / MISSING action: manifest must be IN_TRANSIT.
   */
  assertItemStatusUpdatable(targetStatus: string): void {
    const loadingStates: ManifestStatus[] = [ManifestStatus.ASSIGNED, ManifestStatus.LOADING];
    if (targetStatus === 'LOADED' && !loadingStates.includes(this._status)) {
      throw new ManifestNotModifiableException(
        `Cannot load items on a manifest in status ${this._status}`,
      );
    }
    if (
      (targetStatus === 'UNLOADED' || targetStatus === 'MISSING') &&
      this._status !== ManifestStatus.IN_TRANSIT
    ) {
      throw new ManifestNotModifiableException(
        `Cannot unload/report missing items on a manifest in status ${this._status}`,
      );
    }
  }

  /** True when the manifest is ready and not yet claimed by any trip. */
  acceptsManifestAssignment(): boolean {
    return (
      this._status === ManifestStatus.READY_FOR_DISPATCH &&
      this._tripId === null
    );
  }

  isCompleted(): boolean {
    return this._status === ManifestStatus.COMPLETED;
  }
}
