import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

@Injectable()
export class SuperUserSeeder implements Seeder {
  private readonly logger = new Logger(SuperUserSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Seeding Super User...');

    const email = 'super@all-in-one.com';
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create or update User
    const superUser = await this.prisma.users.upsert({
      where: { email },
      update: {},
      create: {
        email,
        phone: '+9999999999',
        password_hash: passwordHash,
      },
    });

    // 2. Create Platform Admin profile
    await this.prisma.platform_admin.upsert({
      where: { user_id: superUser.id },
      update: {},
      create: {
        user_id: superUser.id,
        full_name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    });

    // Fetch existing tenant
    const tenant = await this.prisma.tenant.findFirst({
      where: { name: { contains: 'FastShip' } },
    });

    if (!tenant) {
      this.logger.warn('Tenant not found, skipping tenant specific profiles.');
      return;
    }

    // 3. Create Tenant Owner profile
    const existingOwner = await this.prisma.tenant_owner.findFirst({
      where: { user_id: superUser.id, tenant_id: tenant.id },
    });

    if (!existingOwner) {
      await this.prisma.tenant_owner.create({
        data: {
          user_id: superUser.id,
          tenant_id: tenant.id,
        },
      });
    }

    // 4. Create Employee profile
    const superEmployee = await this.prisma.employee.upsert({
      where: {
        tenant_id_user_id: {
          tenant_id: tenant.id,
          user_id: superUser.id,
        },
      },
      update: {},
      create: {
        user_id: superUser.id,
        tenant_id: tenant.id,
        employee_code: 'EMP-SUPER-1',
        full_name: 'Super Employee',
      },
    });

    // Assign to a branch
    const branch = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, org_type: 'BRANCH' },
    });

    if (branch) {
      const assignment = await this.prisma.employee_assignment.findFirst({
        where: { employee_id: superEmployee.id, organization_unit_id: branch.id },
      });

      if (!assignment) {
        const empAssignment = await this.prisma.employee_assignment.create({
          data: {
            tenant_id: tenant.id,
            employee_id: superEmployee.id,
            organization_unit_id: branch.id,
          },
        });

        // Find a role to assign
        const role = await this.prisma.role.findFirst({
          where: { tenant_id: tenant.id },
        });

        if (role) {
          await this.prisma.assignment_role.create({
            data: {
              assignment_id: empAssignment.id,
              role_id: role.id,
            },
          });
        }
      }
    }

    // 5. Driver Profile (Vehicle Assignment)
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { tenant_id: tenant.id },
    });

    if (vehicle) {
      const existingVehicleAssignment = await this.prisma.vehicle_assignment.findFirst({
        where: { employee_id: superEmployee.id, vehicle_id: vehicle.id },
      });

      if (!existingVehicleAssignment) {
        await this.prisma.vehicle_assignment.create({
          data: {
            tenant_id: tenant.id,
            employee_id: superEmployee.id,
            vehicle_id: vehicle.id,
            is_active: true,
          },
        });
      }
    }

    // 6. Customer Profile
    await this.prisma.customer_profile.upsert({
      where: { user_id: superUser.id },
      update: {},
      create: {
        user_id: superUser.id,
        full_name: 'Super Customer',
        phone: '+9999999999',
      },
    });

    this.logger.log('✅ Super All-In-One User seeded successfully! (super@all-in-one.com / password123)');
  }
}
