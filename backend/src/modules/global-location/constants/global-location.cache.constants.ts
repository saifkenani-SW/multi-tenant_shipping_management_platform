export const GLOBAL_LOCATION_CACHE_KEYS = {
  PREFIX: 'global-location',
  LIST: 'global-location:list',
  DETAILS: 'global-location:details',
  CHILDREN: 'global-location:children',
};

/** مرجع شبه ثابت: الحدود الإدارية نادراً ما تتغير. */
export const GLOBAL_LOCATION_CACHE_TTL = {
  LIST: 3600,
  DETAILS: 3600,
  CHILDREN: 3600,
};
