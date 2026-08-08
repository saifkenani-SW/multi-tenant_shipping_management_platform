/**
 * Mirrors the ManifestStatus enum in the database schema.
 *
 * Note: the architecture docs propose Pending / Loading / Loaded / Completed /
 * Cancelled. The deployed schema has three states and no Cancelled, so this
 * enum follows the schema. Cancelling a manifest is therefore not modelled.
 */
export const ManifestStatus = {
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
} as const;

export type ManifestStatus =
  (typeof ManifestStatus)[keyof typeof ManifestStatus];
