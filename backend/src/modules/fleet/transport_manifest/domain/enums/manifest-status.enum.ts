/**
 * Mirrors the ManifestStatus enum in the database schema.
 *
 * Lifecycle: OPEN → READY_FOR_DISPATCH → ASSIGNED → LOADING → IN_TRANSIT → COMPLETED
 *
 * - OPEN: manifest is being assembled (items can be added/removed).
 * - READY_FOR_DISPATCH: employee finalised the manifest; it is available for
 *   Fleet to pick up and link to a departing trip. No further item edits allowed.
 * - ASSIGNED: a trip has claimed this manifest and will carry its parcels.
 * - LOADING: the driver has scanned at least one parcel onto the vehicle.
 * - IN_TRANSIT: all parcels are loaded; the vehicle is en route.
 * - COMPLETED: all parcels have been unloaded at the destination unit.
 */
export const ManifestStatus = {
  OPEN: 'OPEN',
  READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
  ASSIGNED: 'ASSIGNED',
  LOADING: 'LOADING',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
} as const;

export type ManifestStatus =
  (typeof ManifestStatus)[keyof typeof ManifestStatus];
