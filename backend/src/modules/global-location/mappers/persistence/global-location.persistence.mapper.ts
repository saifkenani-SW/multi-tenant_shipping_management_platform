import { Injectable } from '@nestjs/common';

import { GeoPoint } from '../../domain/geo-point.value-object';
import { GlobalLocation } from '../../domain/global-location.entity';
import { LocationType } from '../../enums/location-type.enum';

/**
 * الإحداثيات لا تأتي من العمود مباشرة: العمود geometry والـ SELECT
 * يستخرجها بـ ST_X/ST_Y كأرقام، وقد تعود nullable.
 */
export interface GlobalLocationPersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly type: LocationType | string;
  readonly parent_id: string | null;
  readonly longitude?: number | string | null;
  readonly latitude?: number | string | null;
}

@Injectable()
export class GlobalLocationPersistenceMapper {
  toDomain(record: GlobalLocationPersistenceRecord): GlobalLocation {
    return new GlobalLocation(
      record.id,
      record.name,
      record.type as LocationType,
      record.parent_id,
      this.toPoint(record),
    );
  }

  /**
   * أرقام PostgreSQL قد تصل كسلاسل حسب السائق، لذا نحوّل صراحة.
   */
  private toPoint(record: GlobalLocationPersistenceRecord): GeoPoint | null {
    const longitude = this.toNumber(record.longitude);
    const latitude = this.toNumber(record.latitude);

    if (longitude === null || latitude === null) {
      return null;
    }

    return new GeoPoint(longitude, latitude);
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }
}
