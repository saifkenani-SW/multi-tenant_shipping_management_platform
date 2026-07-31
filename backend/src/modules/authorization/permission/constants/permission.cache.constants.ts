export const PERMISSION_CACHE_KEYS = {
  PREFIX: 'permission',
  LIST: 'permission:list',
  DETAILS: 'permission:details',
};

/**
 * الكتالوج شبه ثابت (لا يتغير إلا عند النشر)، لذلك المدد أطول
 * بكثير من كيانات الأعمال.
 */
export const PERMISSION_CACHE_TTL = {
  LIST: 3600,
  DETAILS: 3600,
};
