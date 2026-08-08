import { Injectable } from '@nestjs/common';
import { VehicleAssignment } from '../../domain/entities/vehicle-assignment.entity';

@Injectable()
export class VehicleAssignmentPersistenceMapper {
  toDomain(record: {
    id: string;
    tenant_id: string;
    employee_id: string;
    vehicle_id: string;
    is_active: boolean;
    assigned_at: Date;
    removed_at: Date | null;
  }): VehicleAssignment {
    return new VehicleAssignment(
      record.id,
      record.tenant_id,
      record.employee_id,
      record.vehicle_id,
      record.is_active,
      record.assigned_at,
      record.removed_at,
    );
  }
}
