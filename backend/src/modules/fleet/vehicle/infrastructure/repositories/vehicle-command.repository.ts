import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleAssignment } from '../../domain/entities/vehicle-assignment.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { VehiclePersistenceMapper } from '../mappers/vehicle-persistence.mapper';
import { VehicleAssignmentPersistenceMapper } from '../mappers/vehicle-assignment-persistence.mapper';

@Injectable()
export class VehicleCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly vehiclePersistenceMapper: VehiclePersistenceMapper,
    private readonly assignmentPersistenceMapper: VehicleAssignmentPersistenceMapper,
  ) {}

  async create(data: {
    tenantId: string;
    plateNumber: string;
    type: VehicleType | null;
    capacityKg: number | null;
    status: VehicleStatus;
  }): Promise<Vehicle> {
    const record = await this.prisma.client.vehicle.create({
      data: {
        tenant_id: data.tenantId,
        plate_number: data.plateNumber,
        type: data.type,
        capacity_kg: data.capacityKg,
        status: data.status,
      },
    });

    return this.vehiclePersistenceMapper.toDomain(record);
  }

  async update(
    id: string,
    data: {
      plateNumber?: string;
      type?: VehicleType;
      capacityKg?: number;
      status?: VehicleStatus;
    },
  ): Promise<void> {
    await this.prisma.client.vehicle.update({
      where: { id },
      data: {
        plate_number: data.plateNumber,
        type: data.type,
        capacity_kg: data.capacityKg,
        status: data.status,
      },
    });
  }

  async createAssignment(data: {
    tenantId: string;
    employeeId: string;
    vehicleId: string;
  }): Promise<VehicleAssignment> {
    const record = await this.prisma.client.vehicle_assignment.create({
      data: {
        tenant_id: data.tenantId,
        employee_id: data.employeeId,
        vehicle_id: data.vehicleId,
        is_active: true,
      },
    });

    return this.assignmentPersistenceMapper.toDomain(record);
  }

  async releaseAssignment(id: string): Promise<void> {
    await this.prisma.client.vehicle_assignment.update({
      where: { id },
      data: {
        is_active: false,
        removed_at: new Date(),
      },
    });
  }
}
