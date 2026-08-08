import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction';
import { Trip } from '../../domain/entities/trip.entity';
import { TripStatus } from '../../domain/enums/trip-status.enum';
import { TripPersistenceMapper } from '../mappers/trip-persistence.mapper';

@Injectable()
export class TripCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly tripPersistenceMapper: TripPersistenceMapper,
  ) {}

  async create(trip: Trip): Promise<Trip> {
    const record = await this.prisma.client.trip.create({
      data: {
        tenant_id: trip.tenantId,
        driver_id: trip.driverId,
        vehicle_id: trip.vehicleId,
        origin_org_unit_id: trip.originOrgUnitId,
        destination_org_unit_id: trip.destinationOrgUnitId,
        status: trip.status,
        scheduled_at: trip.scheduledAt,
        notes: trip.notes,
      },
    });

    return this.tripPersistenceMapper.toDomain(record);
  }

  async update(
    id: string,
    data: {
      driverId?: string;
      vehicleId?: string;
      originOrgUnitId?: string;
      destinationOrgUnitId?: string;
      scheduledAt?: Date;
      notes?: string;
    },
  ): Promise<void> {
    await this.prisma.client.trip.update({
      where: { id },
      data: {
        driver_id: data.driverId,
        vehicle_id: data.vehicleId,
        origin_org_unit_id: data.originOrgUnitId,
        destination_org_unit_id: data.destinationOrgUnitId,
        scheduled_at: data.scheduledAt,
        notes: data.notes,
      },
    });
  }

  /**
   * Persists a state transition already approved by the Trip aggregate.
   * The repository never decides the new status — it only records it.
   */
  async updateStatus(
    id: string,
    status: TripStatus,
    timestamps: { startedAt?: Date | null; endedAt?: Date | null },
  ): Promise<void> {
    await this.prisma.client.trip.update({
      where: { id },
      data: {
        status,
        started_at: timestamps.startedAt ?? undefined,
        ended_at: timestamps.endedAt ?? undefined,
      },
    });
  }
}
