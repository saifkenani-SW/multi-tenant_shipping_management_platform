import { Injectable } from '@nestjs/common';

import { GeoPoint } from '../../../global-location/domain/geo-point.value-object';
import { OrganizationUnit } from '../../domain/organization-unit.entity';
import { OrgType } from '../../enums/org-type.enum';

/**
 * `location` عمود geometry غائب عن أنواع Kysely المولّدة، فتُستخرج
 * إحداثياته بـ ST_X/ST_Y وقد تعود كسلاسل حسب السائق.
 */
export interface OrganizationUnitPersistenceRecord {
  readonly id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly org_type: OrgType | string;
  readonly parent_id: string | null;
  readonly zone_id: string | null;
  readonly address_line: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly longitude?: number | string | null;
  readonly latitude?: number | string | null;
}

@Injectable()
export class OrganizationUnitPersistenceMapper {
  toDomain(
    record: OrganizationUnitPersistenceRecord,
    coverageLocationIds: readonly string[] = [],
  ): OrganizationUnit {
    return new OrganizationUnit(
      record.id,
      record.tenant_id,
      record.name,
      record.org_type as OrgType,
      record.parent_id,
      record.zone_id,
      record.address_line,
      record.is_active,
      record.created_at,
      record.updated_at,
      this.toPoint(record),
      coverageLocationIds,
    );
  }

  private toPoint(record: OrganizationUnitPersistenceRecord): GeoPoint | null {
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
