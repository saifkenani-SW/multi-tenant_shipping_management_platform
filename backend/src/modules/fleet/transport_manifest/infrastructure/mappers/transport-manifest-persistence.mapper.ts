import { Injectable } from '@nestjs/common';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';

@Injectable()
export class TransportManifestPersistenceMapper {
  toDomain(record: {
    id: string;
    tenant_id: string;
    trip_id: string | null;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    status: ManifestStatus;
    created_by_employee_id?: string | null;
    created_by_employee_name?: string | null;
    created_at: Date;
    updated_at: Date;
  }): TransportManifest {
    return TransportManifest.restore({
      id: record.id,
      tenantId: record.tenant_id,
      tripId: record.trip_id ?? null,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      status: record.status,
      createdByEmployeeId: record.created_by_employee_id ?? null,
      createdByEmployeeName: record.created_by_employee_name ?? null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  itemToDomain(record: {
    id: string;
    manifest_id: string;
    parcel_id: string;
    status: ManifestItemStatus;
    loaded_at: Date | null;
    unloaded_at: Date | null;
    added_by_employee_id?: string | null;
    added_by_employee_name?: string | null;
  }): ManifestItem {
    return ManifestItem.restore({
      id: record.id,
      manifestId: record.manifest_id,
      parcelId: record.parcel_id,
      status: record.status,
      loadedAt: record.loaded_at,
      unloadedAt: record.unloaded_at,
      addedByEmployeeId: record.added_by_employee_id ?? null,
      addedByEmployeeName: record.added_by_employee_name ?? null,
    });
  }
}
