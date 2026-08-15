import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { AppendParcelMovementCommand } from '../../application/commands/append-parcel-movement.command';

@Injectable()
export class TrackingCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async appendMovement(command: AppendParcelMovementCommand) {
    return this.prisma.parcel_movement.create({
      data: {
        tenant_id: command.tenantId,
        parcel_id: command.parcelId,
        trip_id: command.tripId,
        organization_unit_id: command.organizationUnitId,
        performed_by_employee_id: command.performedByEmployeeId,
        action_type: command.actionType,
        previous_status: command.previousStatus,
        new_status: command.newStatus,
        previous_condition: command.previousCondition,
        new_condition: command.newCondition,
        organization_unit_name: command.organizationUnitName,
        organization_type: command.organizationType,
        organization_latitude: command.organizationLatitude,
        organization_longitude: command.organizationLongitude,
        trip_number: command.tripNumber,
        performed_by_name: command.performedByName,
        metadata: command.metadata ?? undefined,
        notes: command.notes,
      },
    });
  }
}
