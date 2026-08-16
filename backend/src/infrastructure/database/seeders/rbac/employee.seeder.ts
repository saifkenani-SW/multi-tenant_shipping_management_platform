import { Injectable, Logger } from '@nestjs/common';
import { OrgType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

const EMPLOYEES = [
  {
    id: '00000000-0000-7000-8000-000000000600',
    tenantIndex: 0,
    email: 'admin@fastship.com',
    code: 'EMP-100',
    name: 'محمد عبد الكريم العلي',
    nationalId: '01020304051',
    roleName: 'Administrator',
    orgType: OrgType.HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000601',
    tenantIndex: 0,
    email: 'employee@fastship.com',
    code: 'EMP-101',
    name: 'سارة محمود الحسن',
    nationalId: '01020304052',
    roleName: 'Branch Manager',
    orgType: OrgType.BRANCH,
  },
  {
    id: '00000000-0000-7000-8000-000000000602',
    tenantIndex: 0,
    email: 'driver@fastship.com',
    code: 'EMP-102',
    name: 'سامر فوزي درويش',
    nationalId: '01020304053',
    roleName: 'Driver',
    orgType: OrgType.BRANCH,
  },
  {
    id: '00000000-0000-7000-8000-000000000603',
    tenantIndex: 1,
    email: 'admin@quickdelivery.com',
    code: 'EMP-200',
    name: 'خالد إبراهيم الأحمد',
    nationalId: '02030405061',
    roleName: 'Administrator',
    orgType: OrgType.HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000604',
    tenantIndex: 1,
    email: 'employee@quickdelivery.com',
    code: 'EMP-201',
    name: 'نور الدين حج حسين',
    nationalId: '02030405062',
    roleName: 'Branch Manager',
    orgType: OrgType.BRANCH,
  },
  {
    id: '00000000-0000-7000-8000-000000000605',
    tenantIndex: 1,
    email: 'driver@quickdelivery.com',
    code: 'EMP-202',
    name: 'يوسف حمود العلي',
    nationalId: '02030405063',
    roleName: 'Driver',
    orgType: OrgType.BRANCH,
  },
  {
    id: '00000000-0000-7000-8000-000000000606',
    tenantIndex: 2,
    email: 'admin@globalfreight.com',
    code: 'EMP-300',
    name: 'رنا إسماعيل الحسين',
    nationalId: '03040506071',
    roleName: 'Administrator',
    orgType: OrgType.HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000607',
    tenantIndex: 2,
    email: 'driver@globalfreight.com',
    code: 'EMP-301',
    name: 'محمود عيسى الفراتي',
    nationalId: '03040506072',
    roleName: 'Driver',
    orgType: OrgType.BRANCH,
  },
] as const;

@Injectable()
export class EmployeeSeeder implements Seeder {
  private readonly logger = new Logger(EmployeeSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting EmployeeSeeder...');

    for (const empData of EMPLOYEES) {
      const tenant = SEEDED_TENANTS[empData.tenantIndex];
      const user = await this.prisma.users.findUnique({
        where: { email: empData.email },
      });

      if (!user) {
        this.logger.warn(`Skipping employee ${empData.email}: user not found`);
        continue;
      }

      const role = await this.prisma.role.findFirst({
        where: { tenant_id: tenant.id, name: empData.roleName },
      });

      const orgUnit = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, org_type: empData.orgType },
      });

      const emp = await this.prisma.employee.upsert({
        where: {
          tenant_id_user_id: {
            tenant_id: tenant.id,
            user_id: user.id,
          },
        },
        update: {
          employee_code: empData.code,
          national_id: empData.nationalId,
          full_name: empData.name,
          is_active: true,
        },
        create: {
          id: empData.id,
          tenant_id: tenant.id,
          user_id: user.id,
          employee_code: empData.code,
          national_id: empData.nationalId,
          full_name: empData.name,
          is_active: true,
        },
      });

      if (!orgUnit) {
        continue;
      }

      const assignment = await this.prisma.employee_assignment.upsert({
        where: {
          employee_id_organization_unit_id: {
            employee_id: emp.id,
            organization_unit_id: orgUnit.id,
          },
        },
        update: { is_active: true },
        create: {
          tenant_id: tenant.id,
          employee_id: emp.id,
          organization_unit_id: orgUnit.id,
          is_active: true,
        },
      });

      if (role) {
        await this.prisma.assignment_role.upsert({
          where: {
            assignment_id_role_id: {
              assignment_id: assignment.id,
              role_id: role.id,
            },
          },
          update: {},
          create: {
            assignment_id: assignment.id,
            role_id: role.id,
          },
        });
      }
    }

    this.logger.log('EmployeeSeeder completed.');
  }
}
