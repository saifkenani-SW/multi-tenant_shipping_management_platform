/**
 * Mirrors the TripStatus enum in the database schema.
 *
 * Note: the architecture docs propose a finer-grained lifecycle
 * (Scheduled -> Loading -> InTransit -> Completed). The deployed schema merges
 * Loading and InTransit into a single IN_PROGRESS state, and this enum follows
 * the schema, which is what the database will actually accept.
 */
export const TripStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];
