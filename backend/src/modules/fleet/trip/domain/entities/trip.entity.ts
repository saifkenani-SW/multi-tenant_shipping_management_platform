import { TripStatus } from '../enums/trip-status.enum';
import { InvalidTripRouteException } from '../exceptions/invalid-trip-route.exception';
import { TripAlreadyStartedException } from '../exceptions/trip-already-started.exception';
import { TripCannotBeCancelledException } from '../exceptions/trip-cannot-be-cancelled.exception';
import { TripCannotStartWithoutManifestException } from '../exceptions/trip-cannot-start-without-manifest.exception';
import { TripNotEditableException } from '../exceptions/trip-not-editable.exception';
import { TripNotStartedException } from '../exceptions/trip-not-started.exception';

export interface TripSnapshot {
  id: string;
  tenantId: string;
  driverId: string;
  vehicleId: string | null;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  status: TripStatus;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trip aggregate root.
 *
 * Owns its own lifecycle: every state transition is requested by an application
 * service but decided here. Invalid transitions raise domain exceptions rather
 * than being silently applied.
 */
export class Trip {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly driverId: string,
    public readonly vehicleId: string | null,
    public readonly originOrgUnitId: string,
    public readonly destinationOrgUnitId: string,
    private _status: TripStatus,
    public readonly scheduledAt: Date | null,
    private _startedAt: Date | null,
    private _endedAt: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get status(): TripStatus {
    return this._status;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  /**
   * Validates the invariants that must hold at creation time.
   * A trip always has exactly one origin and one destination, and they must
   * differ — a trip from a branch to itself is not a transport operation.
   */
  static create(props: {
    tenantId: string;
    driverId: string;
    vehicleId: string | null;
    originOrgUnitId: string;
    destinationOrgUnitId: string;
    scheduledAt: Date | null;
    notes: string | null;
  }): Trip {
    Trip.assertRouteIsValid(props.originOrgUnitId, props.destinationOrgUnitId);

    const now = new Date();

    return new Trip(
      '',
      props.tenantId,
      props.driverId,
      props.vehicleId,
      props.originOrgUnitId,
      props.destinationOrgUnitId,
      TripStatus.SCHEDULED,
      props.scheduledAt,
      null,
      null,
      props.notes,
      now,
      now,
    );
  }

  /**
   * Rebuilds an aggregate from persisted state. No validation runs here:
   * stored rows are already-accepted history, not new business decisions.
   */
  static restore(snapshot: TripSnapshot): Trip {
    return new Trip(
      snapshot.id,
      snapshot.tenantId,
      snapshot.driverId,
      snapshot.vehicleId,
      snapshot.originOrgUnitId,
      snapshot.destinationOrgUnitId,
      snapshot.status,
      snapshot.scheduledAt,
      snapshot.startedAt,
      snapshot.endedAt,
      snapshot.notes,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  static assertRouteIsValid(
    originOrgUnitId: string,
    destinationOrgUnitId: string,
  ): void {
    if (originOrgUnitId === destinationOrgUnitId) {
      throw new InvalidTripRouteException();
    }
  }

  /**
   * SCHEDULED -> IN_PROGRESS.
   *
   * A trip may not depart empty: at least one manifest must be attached.
   * The count is supplied by the application service because manifests live in
   * a sibling aggregate — the rule itself is decided here.
   */
  start(manifestCount: number): void {
    if (this._status !== TripStatus.SCHEDULED) {
      throw new TripAlreadyStartedException();
    }

    if (manifestCount < 1) {
      throw new TripCannotStartWithoutManifestException();
    }

    this._status = TripStatus.IN_PROGRESS;
    this._startedAt = new Date();
  }

  /** IN_PROGRESS -> COMPLETED. A trip cannot complete before it departs. */
  complete(): void {
    if (this._status !== TripStatus.IN_PROGRESS) {
      throw new TripNotStartedException();
    }

    this._status = TripStatus.COMPLETED;
    this._endedAt = new Date();
  }

  /** SCHEDULED -> CANCELLED. Once departed, a trip can no longer be cancelled. */
  cancel(): void {
    if (this._status !== TripStatus.SCHEDULED) {
      throw new TripCannotBeCancelledException();
    }

    this._status = TripStatus.CANCELLED;
    this._endedAt = new Date();
  }

  /** Route, driver and vehicle are only mutable while the trip is SCHEDULED. */
  assertEditable(): void {
    if (this._status !== TripStatus.SCHEDULED) {
      throw new TripNotEditableException();
    }
  }

  /**
   * Manifests may only be created for, and loaded on, a trip that has not yet
   * departed. Read by the manifest sub-domain through the trip query service.
   */
  acceptsManifestChanges(): boolean {
    return this._status === TripStatus.SCHEDULED;
  }

  hasDeparted(): boolean {
    return (
      this._status === TripStatus.IN_PROGRESS ||
      this._status === TripStatus.COMPLETED
    );
  }
}
