export class GeoPoint {
  constructor(
    public readonly longitude: number,
    public readonly latitude: number,
  ) {}

  /**
   * PostGIS uses [longitude, latitude] format for ST_MakePoint
   */
  toPostGisPoint(): string {
    return `ST_MakePoint(${this.longitude}, ${this.latitude})`;
  }
}
