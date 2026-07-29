/**
 * تطابق enum LocationType في قاعدة البيانات.
 * الترتيب هنا هو ترتيب الهرم من الأعلى إلى الأدنى.
 */
export enum LocationType {
  COUNTRY = 'COUNTRY',
  GOVERNORATE = 'GOVERNORATE',
  CITY = 'CITY',
  DISTRICT = 'DISTRICT',
  AREA = 'AREA',
}

/** مستوى كل نوع في الهرم؛ الأصغر أعلى. */
export const LOCATION_TYPE_LEVEL: Record<LocationType, number> = {
  [LocationType.COUNTRY]: 0,
  [LocationType.GOVERNORATE]: 1,
  [LocationType.CITY]: 2,
  [LocationType.DISTRICT]: 3,
  [LocationType.AREA]: 4,
};
