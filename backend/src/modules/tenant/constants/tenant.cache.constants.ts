export const TENANT_CACHE_KEYS = {
  PREFIX: 'tenant',
  LIST: 'tenant:list',
  DETAILS: 'tenant:details',
  SETTINGS: 'tenant:settings',
  SUBSCRIPTION_ACTIVE: 'tenant:subscription:active',
  SUBSCRIPTION_HISTORY: 'tenant:subscription:history',
};

export const TENANT_CACHE_TTL = {
  LIST: 300,
  DETAILS: 600,
  SETTINGS: 600,
  SUBSCRIPTION: 600,
};
