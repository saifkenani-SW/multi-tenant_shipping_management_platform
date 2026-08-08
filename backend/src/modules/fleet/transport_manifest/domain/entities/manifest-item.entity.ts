import { ManifestItemStatus } from '../enums/manifest-item-status.enum';
import { InvalidManifestItemTransitionException } from '../exceptions/invalid-manifest-item-transition.exception';

export interface ManifestItemSnapshot {
  id: string;
  manifestId: string;
  parcelId: string;
  status: ManifestItemStatus;
  loadedAt: Date | null;
  unloadedAt: Date | null;
}

/**
 * A single parcel listed on a manifest.
 *
 * This is a child entity inside the TransportManifest aggregate: it has its own
 * identity and lifecycle, but is only ever reached through its manifest.
 */
export class ManifestItem {
  private constructor(
    public readonly id: string,
    public readonly manifestId: string,
    public readonly parcelId: string,
    private _status: ManifestItemStatus,
    private _loadedAt: Date | null,
    private _unloadedAt: Date | null,
  ) {}

  get status(): ManifestItemStatus {
    return this._status;
  }

  get loadedAt(): Date | null {
    return this._loadedAt;
  }

  get unloadedAt(): Date | null {
    return this._unloadedAt;
  }

  static create(props: { manifestId: string; parcelId: string }): ManifestItem {
    return new ManifestItem(
      '',
      props.manifestId,
      props.parcelId,
      ManifestItemStatus.PENDING_LOAD,
      null,
      null,
    );
  }

  static restore(snapshot: ManifestItemSnapshot): ManifestItem {
    return new ManifestItem(
      snapshot.id,
      snapshot.manifestId,
      snapshot.parcelId,
      snapshot.status,
      snapshot.loadedAt,
      snapshot.unloadedAt,
    );
  }

  /** PENDING_LOAD -> LOADED. */
  markLoaded(): void {
    if (this._status !== ManifestItemStatus.PENDING_LOAD) {
      throw new InvalidManifestItemTransitionException(
        this._status,
        ManifestItemStatus.LOADED,
      );
    }

    this._status = ManifestItemStatus.LOADED;
    this._loadedAt = new Date();
  }

  /** LOADED -> UNLOADED. A parcel that never went on board cannot come off. */
  markUnloaded(): void {
    if (this._status !== ManifestItemStatus.LOADED) {
      throw new InvalidManifestItemTransitionException(
        this._status,
        ManifestItemStatus.UNLOADED,
      );
    }

    this._status = ManifestItemStatus.UNLOADED;
    this._unloadedAt = new Date();
  }

  /**
   * Reports a parcel as missing. Only meaningful while it is still expected —
   * a parcel already delivered at the destination cannot go missing in transit.
   */
  markMissing(): void {
    if (
      this._status !== ManifestItemStatus.PENDING_LOAD &&
      this._status !== ManifestItemStatus.LOADED
    ) {
      throw new InvalidManifestItemTransitionException(
        this._status,
        ManifestItemStatus.MISSING,
      );
    }

    this._status = ManifestItemStatus.MISSING;
  }

  /**
   * An item still occupies its parcel while it is expected to travel or is
   * travelling. Once unloaded or reported missing, the parcel is free to be
   * listed on a new manifest.
   */
  isOccupyingParcel(): boolean {
    return (
      this._status === ManifestItemStatus.PENDING_LOAD ||
      this._status === ManifestItemStatus.LOADED
    );
  }
}
