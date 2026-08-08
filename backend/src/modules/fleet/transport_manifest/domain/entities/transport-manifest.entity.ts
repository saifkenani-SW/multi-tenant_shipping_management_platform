import { ManifestStatus } from '../enums/manifest-status.enum';
import { InvalidManifestRouteException } from '../exceptions/invalid-manifest-route.exception';
import { ManifestNotInTransitException } from '../exceptions/manifest-not-in-transit.exception';
import { ManifestNotModifiableException } from '../exceptions/manifest-not-modifiable.exception';

export interface TransportManifestSnapshot {
  id: string;
  tenantId: string;
  tripId: string;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  status: ManifestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TransportManifest aggregate root.
 *
 * Owns the parcels travelling on one trip. Its items are only reachable through
 * this aggregate, and it decides when that list may still be changed.
 */
export class TransportManifest {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly tripId: string,
    public readonly originOrgUnitId: string,
    public readonly destinationOrgUnitId: string,
    private _status: ManifestStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get status(): ManifestStatus {
    return this._status;
  }

  static create(props: {
    tenantId: string;
    tripId: string;
    originOrgUnitId: string;
    destinationOrgUnitId: string;
  }): TransportManifest {
    TransportManifest.assertRouteIsValid(
      props.originOrgUnitId,
      props.destinationOrgUnitId,
    );

    const now = new Date();

    return new TransportManifest(
      '',
      props.tenantId,
      props.tripId,
      props.originOrgUnitId,
      props.destinationOrgUnitId,
      ManifestStatus.PENDING,
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
   * Parcels may only be added or removed while the manifest is still PENDING.
   * Once the trip departs the manifest moves to IN_TRANSIT and its contents are
   * fixed; once COMPLETED it is immutable.
   */
  assertItemsModifiable(): void {
    if (this._status !== ManifestStatus.PENDING) {
      throw new ManifestNotModifiableException();
    }
  }

  /** PENDING -> IN_TRANSIT. Applied when the owning trip departs. */
  markInTransit(): void {
    if (this._status !== ManifestStatus.PENDING) {
      throw new ManifestNotModifiableException();
    }

    this._status = ManifestStatus.IN_TRANSIT;
  }

  /** IN_TRANSIT -> COMPLETED. Terminal: the manifest becomes immutable. */
  complete(): void {
    if (this._status !== ManifestStatus.IN_TRANSIT) {
      throw new ManifestNotInTransitException();
    }

    this._status = ManifestStatus.COMPLETED;
  }

  isCompleted(): boolean {
    return this._status === ManifestStatus.COMPLETED;
  }
}
