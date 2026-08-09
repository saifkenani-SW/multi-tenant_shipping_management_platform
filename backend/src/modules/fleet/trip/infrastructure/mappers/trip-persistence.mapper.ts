import { Injectable } from '@nestjs/common';
import { Trip } from '../../domain/entities/trip.entity';
import { TripStatus } from '../../domain/enums/trip-status.enum';

@Injectable()
export class TripPersistenceMapper {
  toDomain(record: {
    id: string;
    tenant_id: string;
    driver_id: string;
    vehicle_id: string | null;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    status: TripStatus;
    scheduled_at: Date | null;
    started_at: Date | null;
    ended_at: Date | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }): Trip {
    return Trip.restore({
      id: record.id,
      tenantId: record.tenant_id,
      driverId: record.driver_id,
      vehicleId: record.vehicle_id,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      status: record.status,
      scheduledAt: record.scheduled_at,
      startedAt: record.started_at,
      endedAt: record.ended_at,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }
}
