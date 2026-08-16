import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { ORG_UNIT_NAME } from './organization-unit.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

const EMPLOYEES = [
  {
    id: '00000000-0000-7000-8000-000000000600',
    tenantIndex: 0,
    email: 'admin@fastship.com',
    code: 'EMP-100',
    name: 'مهند رسلان',
    nationalId: '01020304051',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000601',
    tenantIndex: 0,
    email: 'employee@fastship.com',
    code: 'EMP-101',
    name: 'لينا خوري',
    nationalId: '01020304052',
    orgUnitName: ORG_UNIT_NAME.MASARAT_ALEPPO,
  },
  {
    id: '00000000-0000-7000-8000-000000000602',
    tenantIndex: 0,
    email: 'driver@fastship.com',
    code: 'EMP-102',
    name: 'سامر فوزي درويش',
    nationalId: '01020304053',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000608',
    tenantIndex: 0,
    email: 'rami.kassar@masarat.sy',
    code: 'EMP-103',
    name: 'رامي قصّار',
    nationalId: '01020304054',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000609',
    tenantIndex: 0,
    email: 'dina.halabi@masarat.sy',
    code: 'EMP-104',
    name: 'دينا الحلبي',
    nationalId: '01020304055',
    orgUnitName: ORG_UNIT_NAME.MASARAT_WAREHOUSE,
  },
  {
    id: '00000000-0000-7000-8000-000000000610',
    tenantIndex: 0,
    email: 'fadi.sabbagh@masarat.sy',
    code: 'EMP-105',
    name: 'فادي صباغ',
    nationalId: '01020304056',
    orgUnitName: ORG_UNIT_NAME.MASARAT_JARAMANA,
  },
  {
    id: '00000000-0000-7000-8000-000000000611',
    tenantIndex: 0,
    email: 'lina.barakat@masarat.sy',
    code: 'EMP-106',
    name: 'لينا بركات',
    nationalId: '01020304057',
    orgUnitName: ORG_UNIT_NAME.MASARAT_LATAKIA,
  },
  {
    id: '00000000-0000-7000-8000-000000000612',
    tenantIndex: 0,
    email: 'hassan.nabulsi@masarat.sy',
    code: 'EMP-107',
    name: 'حسن نابلسي',
    nationalId: '01020304058',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HOMS,
  },
  {
    id: '00000000-0000-7000-8000-000000000613',
    tenantIndex: 0,
    email: 'maya.qasem@masarat.sy',
    code: 'EMP-108',
    name: 'مايا قاسم',
    nationalId: '01020304059',
    orgUnitName: ORG_UNIT_NAME.MASARAT_DARAA,
  },
  {
    id: '00000000-0000-7000-8000-000000000614',
    tenantIndex: 0,
    email: 'walid.hariri@masarat.sy',
    code: 'EMP-109',
    name: 'وليد الحريري',
    nationalId: '01020304060',
    orgUnitName: ORG_UNIT_NAME.MASARAT_DEIR,
  },
  {
    id: '00000000-0000-7000-8000-000000000615',
    tenantIndex: 0,
    email: 'salma.kilani@masarat.sy',
    code: 'EMP-110',
    name: 'سلمى كيلاني',
    nationalId: '01020304061',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000616',
    tenantIndex: 0,
    email: 'driver2@masarat.sy',
    code: 'EMP-111',
    name: 'ياسر العموري',
    nationalId: '01020304062',
    orgUnitName: ORG_UNIT_NAME.MASARAT_HOMS,
  },
  {
    id: '00000000-0000-7000-8000-000000000617',
    tenantIndex: 0,
    email: 'driver3@masarat.sy',
    code: 'EMP-112',
    name: 'خالد الجابي',
    nationalId: '01020304063',
    orgUnitName: ORG_UNIT_NAME.MASARAT_LATAKIA,
  },
  {
    id: '00000000-0000-7000-8000-000000000618',
    tenantIndex: 0,
    email: 'driver4@masarat.sy',
    code: 'EMP-113',
    name: 'نبيل قضماني',
    nationalId: '01020304064',
    orgUnitName: ORG_UNIT_NAME.MASARAT_DARAA,
  },
  {
    id: '00000000-0000-7000-8000-000000000619',
    tenantIndex: 0,
    email: 'driver5@masarat.sy',
    code: 'EMP-114',
    name: 'حسام الأخرس',
    nationalId: '01020304065',
    orgUnitName: ORG_UNIT_NAME.MASARAT_ALEPPO,
  },
  {
    id: '00000000-0000-7000-8000-000000000603',
    tenantIndex: 1,
    email: 'admin@quickdelivery.com',
    code: 'EMP-200',
    name: 'أحمد ياسين الحسن',
    nationalId: '02030405061',
    orgUnitName: ORG_UNIT_NAME.QADMOUS_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000604',
    tenantIndex: 1,
    email: 'employee@quickdelivery.com',
    code: 'EMP-201',
    name: 'نور الدين حج حسين',
    nationalId: '02030405062',
    orgUnitName: ORG_UNIT_NAME.QADMOUS_ALEPPO,
  },
  {
    id: '00000000-0000-7000-8000-000000000605',
    tenantIndex: 1,
    email: 'driver@quickdelivery.com',
    code: 'EMP-202',
    name: 'علي محمود حمدان',
    nationalId: '02030405063',
    orgUnitName: ORG_UNIT_NAME.QADMOUS_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000606',
    tenantIndex: 2,
    email: 'admin@globalfreight.com',
    code: 'EMP-300',
    name: 'رنا إسماعيل الحسين',
    nationalId: '03040506071',
    orgUnitName: ORG_UNIT_NAME.TROJAN_HUB,
  },
  {
    id: '00000000-0000-7000-8000-000000000607',
    tenantIndex: 2,
    email: 'driver@globalfreight.com',
    code: 'EMP-301',
    name: 'محمود عيسى الخضر',
    nationalId: '03040506072',
    orgUnitName: ORG_UNIT_NAME.TROJAN_DAMASCUS,
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

      const roles = await this.prisma.role.findMany({
        where: { tenant_id: tenant.id },
      });

      const orgUnit = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, name: empData.orgUnitName },
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
        this.logger.warn(
          `Skipping assignment for ${empData.email}: org unit ${empData.orgUnitName} not found`,
        );
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

      for (const role of roles) {
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
