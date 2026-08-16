import { Injectable, Logger } from '@nestjs/common';
import { VehicleStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

const VEHICLES = [
  {
    id: '00000000-0000-7000-8000-000000001000',
    tenantIndex: 0,
    plate: '441203-دمشق',
    type: VehicleType.Van,
    capacity: 1500,
    driverEmail: 'driver@fastship.com',
  },
  {
    id: '00000000-0000-7000-8000-000000001003',
    tenantIndex: 0,
    plate: '112088-دمشق',
    type: VehicleType.Truck,
    capacity: 4000,
    driverEmail: null,
  },
  {
    id: '00000000-0000-7000-8000-000000001001',
    tenantIndex: 1,
    plate: '338901-حلب',
    type: VehicleType.Van,
    capacity: 1200,
    driverEmail: 'driver@quickdelivery.com',
  },
  {
    id: '00000000-0000-7000-8000-000000001002',
    tenantIndex: 2,
    plate: '220445-ديرالزور',
    type: VehicleType.Truck,
    capacity: 3500,
    driverEmail: 'driver@globalfreight.com',
  },
] as const;

@Injectable()
export class VehicleSeeder implements Seeder {
  private readonly logger = new Logger(VehicleSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting VehicleSeeder...');

    for (let i = 0; i < VEHICLES.length; i++) {
      const item = VEHICLES[i];
      const tenant = SEEDED_TENANTS[item.tenantIndex];

      const vehicle = await this.prisma.vehicle.upsert({
        where: {
          tenant_id_plate_number: {
            tenant_id: tenant.id,
            plate_number: item.plate,
          },
        },
        update: {
          type: item.type,
          capacity_kg: item.capacity,
          status: VehicleStatus.ACTIVE,
        },
        create: {
          id: item.id,
          tenant_id: tenant.id,
          plate_number: item.plate,
          type: item.type,
          capacity_kg: item.capacity,
          status: VehicleStatus.ACTIVE,
        },
      });

      if (!item.driverEmail) {
        continue;
      }

      const driverUser = await this.prisma.users.findUnique({
        where: { email: item.driverEmail },
      });
      if (!driverUser) {
        continue;
      }

      const driverEmp = await this.prisma.employee.findFirst({
        where: { tenant_id: tenant.id, user_id: driverUser.id },
      });
      if (!driverEmp) {
        continue;
      }

      const existingAssignment = await this.prisma.vehicle_assignment.findFirst({
        where: {
          OR: [
            { employee_id: driverEmp.id, is_active: true },
            { vehicle_id: vehicle.id, is_active: true },
          ],
        },
      });

      if (existingAssignment) {
        continue;
      }

      const vehicleAssignId = `00000000-0000-7000-8000-00000000101${i}`;
      await this.prisma.vehicle_assignment.create({
        data: {
          id: vehicleAssignId,
          tenant_id: tenant.id,
          employee_id: driverEmp.id,
          vehicle_id: vehicle.id,
          is_active: true,
        },
      });
    }

    this.logger.log('VehicleSeeder completed.');
  }
}
