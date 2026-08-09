import { Injectable } from '@nestjs/common';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';

@Injectable()
export class VehiclePersistenceMapper {
  toDomain(record: {
    id: string;
    tenant_id: string;
    plate_number: string;
    type: VehicleType | null;
    capacity_kg: { toString(): string } | string | null;
    status: VehicleStatus;
    created_at: Date;
    updated_at: Date;
  }): Vehicle {
    return new Vehicle(
      record.id,
      record.tenant_id,
      record.plate_number,
      record.type,
      record.capacity_kg === null ? null : Number(record.capacity_kg),
      record.status,
      record.created_at,
      record.updated_at,
    );
  }
}
