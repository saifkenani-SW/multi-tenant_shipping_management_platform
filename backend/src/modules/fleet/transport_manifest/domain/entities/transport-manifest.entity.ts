import { ManifestStatus } from '../enums/manifest-status.enum';
import { InvalidManifestRouteException } from '../exceptions/invalid-manifest-route.exception';
import { ManifestNotInTransitException } from '../exceptions/manifest-not-in-transit.exception';
import { ManifestNotModifiableException } from '../exceptions/manifest-not-modifiable.exception';
import { ManifestNotFinalizableException } from '../exceptions/manifest-not-finalizable.exception';
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

/**
 * TransportManifest aggregate root.
 *
 * Lifecycle: OPEN → READY_FOR_DISPATCH → IN_TRANSIT → COMPLETED
 *
 * A manifest is created standalone (OPEN, no trip). An employee assembles
 * parcels on it and then calls finalize() to signal it is ready for dispatch.
 * Fleet links it to a departing trip (which drives it to IN_TRANSIT). On trip
 * completion the manifest is automatically moved to COMPLETED.
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
    if (this._status !== ManifestStatus.OPEN) {
      throw new ManifestNotFinalizableException();
    }
    this._status = ManifestStatus.READY_FOR_DISPATCH;
  }

  /**
   * READY_FOR_DISPATCH → OPEN.
   * Only allowed while no trip has claimed this manifest yet.
   */
  reopen(): void {
    if (this._status !== ManifestStatus.READY_FOR_DISPATCH) {
      throw new ManifestNotReopenableException();
    }
    if (this._tripId !== null) {
      throw new ManifestNotReopenableException();
    }
    this._status = ManifestStatus.OPEN;
  }

  /**
   * READY_FOR_DISPATCH → ASSIGNED.
   * Called when a dispatcher assigns this available manifest to a scheduled trip.
   */
  assignToTrip(tripId: string): void {
    if (this._status !== ManifestStatus.READY_FOR_DISPATCH) {
      throw new ManifestNotModifiableException();
    }
    if (this._tripId !== null) {
      throw new ManifestNotModifiableException();
    }
    this._tripId = tripId;
    this._status = ManifestStatus.ASSIGNED;
  }

  /** ASSIGNED → IN_TRANSIT. Applied when the owning trip departs. */
  markInTransit(): void {
    if (this._status !== ManifestStatus.ASSIGNED) {
      throw new ManifestNotModifiableException();
    }
    this._status = ManifestStatus.IN_TRANSIT;
  }

  /** IN_TRANSIT → COMPLETED. Terminal: the manifest becomes immutable. */
  complete(): void {
    if (this._status !== ManifestStatus.IN_TRANSIT) {
      throw new ManifestNotInTransitException();
    }
    this._status = ManifestStatus.COMPLETED;
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
