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
        trip_id: manifest.tripId,
        origin_org_unit_id: manifest.originOrgUnitId,
        destination_org_unit_id: manifest.destinationOrgUnitId,
        status: manifest.status,
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
   * Moves every PENDING manifest of a trip to IN_TRANSIT in one statement.
   * Called when the owning trip departs.
   */
  async markTripManifestsInTransit(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.prisma.client.transport_manifest.updateMany({
      where: {
        tenant_id: tenantId,
        trip_id: tripId,
        status: ManifestStatus.PENDING,
      },
      data: { status: ManifestStatus.IN_TRANSIT },
    });
  }

  async createItem(item: ManifestItem): Promise<ManifestItem> {
    const record = await this.prisma.client.manifest_item.create({
      data: {
        manifest_id: item.manifestId,
        parcel_id: item.parcelId,
        status: item.status,
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
