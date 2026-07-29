import { Injectable, Logger } from '@nestjs/common';
import { VehicleStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class VehicleSeeder implements Seeder {
  private readonly logger = new Logger(VehicleSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting VehicleSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const plateNumber = `KSA-${1000 + i}`;
      const vehicleId = `00000000-0000-7000-8000-00000000100${i}`;

      await this.prisma.vehicle.upsert({
        where: {
          tenant_id_plate_number: {
            tenant_id: tenant.id,
            plate_number: plateNumber,
          },
        },
        update: {
          type: VehicleType.Van,
          capacity_kg: 1500.0,
          status: VehicleStatus.ACTIVE,
        },
        create: {
          id: vehicleId,
          tenant_id: tenant.id,
          plate_number: plateNumber,
          type: VehicleType.Van,
          capacity_kg: 1500.0,
          status: VehicleStatus.ACTIVE,
        },
      });
    }

    this.logger.log('VehicleSeeder completed.');
  }
}
