export const TENANT_ZONE_CACHE_KEYS = {
  PREFIX: 'tenant-zone',
  LIST: 'tenant-zone:list',
  DETAILS: 'tenant-zone:details',
  /** Lightweight per-ID cache: stores { id, tenantId } only. */
  IDS: 'tenant-zone:ids',
};

export const TENANT_ZONE_CACHE_TTL = {
  LIST: 86400, // 24 hours
  DETAILS: 86400, // 24 hours
};
