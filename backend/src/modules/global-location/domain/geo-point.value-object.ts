/**
 * نقطة جغرافية بنظام WGS84 (SRID 4326).
 *
 * يخزَّن العمود كـ geometry(Point, 4326) وهو نوع لا يفهمه Prisma
 * (Unsupported)، لذلك تُقرأ الإحداثيات وتُكتب عبر SQL خام.
 */
export class GeoPoint {
  constructor(
    public readonly longitude: number,
    public readonly latitude: number,
  ) {
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError(`Invalid longitude: ${longitude}`);
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new RangeError(`Invalid latitude: ${latitude}`);
    }

    Object.freeze(this);
  }

  /**
   * يبني نقطة من قيمتين قد تكونا غائبتين، ويرفض تمرير إحداثي واحد فقط
   * لأن نصف نقطة خطأ إدخال لا حالة صحيحة.
   */
  static fromNullable(
    longitude: number | null | undefined,
    latitude: number | null | undefined,
  ): GeoPoint | null {
    const hasLongitude = longitude !== null && longitude !== undefined;
    const hasLatitude = latitude !== null && latitude !== undefined;

    if (!hasLongitude && !hasLatitude) {
      return null;
    }

    if (!hasLongitude || !hasLatitude) {
      throw new RangeError(
        'Both longitude and latitude are required to define a point',
      );
    }

    return new GeoPoint(longitude, latitude);
  }
}
