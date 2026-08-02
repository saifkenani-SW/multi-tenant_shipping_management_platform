import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../packages/transaction';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { VehiclePersistenceMapper } from '../mappers/vehicle-persistence.mapper';

@Injectable()
export class VehicleCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly vehiclePersistenceMapper: VehiclePersistenceMapper,
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
}
