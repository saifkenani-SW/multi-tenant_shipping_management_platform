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
    trip_id: string;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    status: ManifestStatus;
    created_at: Date;
    updated_at: Date;
  }): TransportManifest {
    return TransportManifest.restore({
      id: record.id,
      tenantId: record.tenant_id,
      tripId: record.trip_id,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      status: record.status,
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
  }): ManifestItem {
    return ManifestItem.restore({
      id: record.id,
      manifestId: record.manifest_id,
      parcelId: record.parcel_id,
      status: record.status,
      loadedAt: record.loaded_at,
      unloadedAt: record.unloaded_at,
    });
  }
}
