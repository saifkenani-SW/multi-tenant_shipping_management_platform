import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';
import { TransportManifestPersistenceMapper } from '../mappers/transport-manifest-persistence.mapper';

@Injectable()
export class TransportManifestCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly persistenceMapper: TransportManifestPersistenceMapper,
  ) {}

  async create(manifest: TransportManifest): Promise<TransportManifest> {
    const record = await this.prisma.client.transport_manifest.create({
      data: {
        tenant_id: manifest.tenantId,
        trip_id: manifest.tripId ?? undefined,
        origin_org_unit_id: manifest.originOrgUnitId,
        destination_org_unit_id: manifest.destinationOrgUnitId,
        status: manifest.status,
        created_by_employee_id: manifest.createdByEmployeeId ?? undefined,
        created_by_employee_name: manifest.createdByEmployeeName ?? undefined,
      },
    });

    return this.persistenceMapper.toDomain(record);
  }

  /** Persists a transition already approved by the manifest aggregate. */
  async updateStatus(id: string, status: ManifestStatus): Promise<void> {
    await this.prisma.client.transport_manifest.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Moves every READY_FOR_DISPATCH manifest of a trip to IN_TRANSIT in one
   * statement. Called when the owning trip departs.
   */
  async markTripManifestsInTransit(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.prisma.client.transport_manifest.updateMany({
      where: {
        tenant_id: tenantId,
        trip_id: tripId,
        status: ManifestStatus.READY_FOR_DISPATCH,
      },
      data: { status: ManifestStatus.IN_TRANSIT },
    });
  }

  /**
   * Moves every IN_TRANSIT manifest of a completed trip to COMPLETED.
   * Called when the owning trip completes.
   */
  async markTripManifestsCompleted(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.prisma.client.transport_manifest.updateMany({
      where: {
        tenant_id: tenantId,
        trip_id: tripId,
        status: ManifestStatus.IN_TRANSIT,
      },
      data: { status: ManifestStatus.COMPLETED },
    });
  }

  /**
   * Atomically links a list of READY_FOR_DISPATCH + unlinked manifests to a
   * trip. Returns the count of rows actually updated for the caller to verify
   * against the requested set (race-condition guard).
   */
  async linkToTrip(
    manifestIds: string[],
    tripId: string,
    tenantId: string,
  ): Promise<number> {
    const result = await this.prisma.client.transport_manifest.updateMany({
      where: {
        id: { in: manifestIds },
        tenant_id: tenantId,
        status: ManifestStatus.READY_FOR_DISPATCH,
        trip_id: null,
      },
      data: { trip_id: tripId },
    });

    return result.count;
  }

  async createItem(item: ManifestItem): Promise<ManifestItem> {
    const record = await this.prisma.client.manifest_item.create({
      data: {
        manifest_id: item.manifestId,
        parcel_id: item.parcelId,
        status: item.status,
        added_by_employee_id: item.addedByEmployeeId ?? undefined,
        added_by_employee_name: item.addedByEmployeeName ?? undefined,
      },
    });

    return this.persistenceMapper.itemToDomain(record);
  }

  async updateItemStatus(
    id: string,
    status: ManifestItemStatus,
    timestamps: { loadedAt?: Date | null; unloadedAt?: Date | null },
  ): Promise<void> {
    await this.prisma.client.manifest_item.update({
      where: { id },
      data: {
        status,
        loaded_at: timestamps.loadedAt ?? undefined,
        unloaded_at: timestamps.unloadedAt ?? undefined,
      },
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.client.manifest_item.delete({ where: { id } });
  }
}
