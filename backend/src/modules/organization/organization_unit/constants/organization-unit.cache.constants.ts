export const ORG_UNIT_CACHE_KEYS = {
  PREFIX: 'organization-unit',
  LIST: 'organization-unit:list',
  DETAILS: 'organization-unit:details',
  CANDIDATES: 'organization-unit:candidates',
  /** Lightweight per-ID cache: stores { id, tenantId } only. Separate from DETAILS to avoid collision with full DTO cache entries. */
  IDS: 'organization-unit:ids',
};

export const ORG_UNIT_CACHE_TTL = {
  LIST: 86400, // 24 hours
  DETAILS: 86400, // 24 hours
  CANDIDATES: 1800, // 30 minutes
};
