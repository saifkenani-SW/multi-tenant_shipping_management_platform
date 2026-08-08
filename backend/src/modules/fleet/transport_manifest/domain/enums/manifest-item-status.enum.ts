export const ManifestItemStatus = {
  PENDING_LOAD: 'PENDING_LOAD',
  LOADED: 'LOADED',
  UNLOADED: 'UNLOADED',
  MISSING: 'MISSING',
} as const;

export type ManifestItemStatus =
  (typeof ManifestItemStatus)[keyof typeof ManifestItemStatus];
