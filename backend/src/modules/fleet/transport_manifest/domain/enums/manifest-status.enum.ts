/**
 * Mirrors the ManifestStatus enum in the database schema.
 *
 * Lifecycle: OPEN → READY_FOR_DISPATCH → IN_TRANSIT → COMPLETED
 *
 * - OPEN: manifest is being assembled (items can be added/removed).
 * - READY_FOR_DISPATCH: employee finalised the manifest; it is available for
 *   Fleet to pick up and link to a departing trip. No further item edits allowed.
 * - IN_TRANSIT: the owning trip has departed. Manifest is read-only.
 * - COMPLETED: trip arrived, manifest permanently closed.
 */
export const ManifestStatus = {
  OPEN: 'OPEN',
  READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
} as const;

export type ManifestStatus =
  (typeof ManifestStatus)[keyof typeof ManifestStatus];
