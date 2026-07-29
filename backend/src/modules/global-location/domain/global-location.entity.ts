import { LocationType } from '../enums/location-type.enum';
import { GeoPoint } from './geo-point.value-object';

/**
 * GlobalLocation Domain Entity.
 *
 * مرجع جغرافي عام لا ينتمي لأي tenant: دولة ثم محافظة ثم مدينة ثم
 * منطقة ثم حي، عبر parent_id. تُسنَد إليه وحدات التنظيم لتحديد تغطيتها.
 */
export class GlobalLocation {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: LocationType,
    public readonly parentId: string | null = null,
    public readonly point: GeoPoint | null = null,
  ) {}
}
