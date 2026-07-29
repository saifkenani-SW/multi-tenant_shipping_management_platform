import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class EmployeeSeeder implements Seeder {
  private readonly logger = new Logger(EmployeeSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting EmployeeSeeder...');

    const tenant1 = SEEDED_TENANTS[0];

    const adminUser = await this.prisma.users.findUnique({
      where: { email: 'admin@fastship.com' },
    });
    const driverUser = await this.prisma.users.findUnique({
      where: { email: 'driver1@fastship.com' },
    });

    if (!adminUser || !driverUser) {
      this.logger.warn('Skipping EmployeeSeeder: adminUser or driverUser not found');
      return;
    }

    const orgUnit = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id },
    });

    const adminRole = await this.prisma.role.findFirst({
      where: { tenant_id: tenant1.id, name: 'Administrator' },
    });

    const driverRole = await this.prisma.role.findFirst({
      where: { tenant_id: tenant1.id, name: 'Driver' },
    });

    const employeesToSeed = [
      {
        id: '00000000-0000-7000-8000-000000000601',
        user_id: adminUser.id,
        code: 'EMP-001',
        name: 'FastShip Admin',
        role: adminRole,
      },
      {
        id: '00000000-0000-7000-8000-000000000602',
        user_id: driverUser.id,
        code: 'EMP-002',
        name: 'Sami Driver',
        role: driverRole,
      },
    ];

    for (let i = 0; i < employeesToSeed.length; i++) {
      const empData = employeesToSeed[i];

      const emp = await this.prisma.employee.upsert({
        where: {
          tenant_id_user_id: {
            tenant_id: tenant1.id,
            user_id: empData.user_id,
          },
        },
        update: {
          employee_code: empData.code,
          full_name: empData.name,
          is_active: true,
        },
        create: {
          id: empData.id,
          tenant_id: tenant1.id,
          user_id: empData.user_id,
          employee_code: empData.code,
          full_name: empData.name,
          is_active: true,
        },
      });

      if (orgUnit) {
        const assignmentId = `00000000-0000-7000-8000-00000000065${i}`;
        const assignment = await this.prisma.employee_assignment.upsert({
          where: {
            employee_id_organization_unit_id: {
              employee_id: emp.id,
              organization_unit_id: orgUnit.id,
            },
          },
          update: { is_active: true },
          create: {
            id: assignmentId,
            tenant_id: tenant1.id,
            employee_id: emp.id,
            organization_unit_id: orgUnit.id,
            is_active: true,
          },
        });

        if (empData.role) {
          const assignRoleId = `00000000-0000-7000-8000-00000000067${i}`;
          await this.prisma.assignment_role.upsert({
            where: {
              assignment_id_role_id: {
                assignment_id: assignment.id,
                role_id: empData.role.id,
              },
            },
            update: {},
            create: {
              id: assignRoleId,
              assignment_id: assignment.id,
              role_id: empData.role.id,
            },
          });
        }
      }
    }

    this.logger.log('EmployeeSeeder completed.');
  }
}
