export const PRICING_CACHE_KEYS = {
  PREFIX: 'pricing',
  LIST: 'pricing:list',
  DETAILS: 'pricing:details',
  ROUTE: 'pricing:route',
};

export const PRICING_CACHE_TTL = {
  LIST: 86400, // 24 hours
  DETAILS: 86400, // 24 hours
  ROUTE: 3600, // 1 hour
};
