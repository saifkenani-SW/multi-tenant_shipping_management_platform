import { Injectable, Logger } from '@nestjs/common';
import { OrgType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { LOCATION } from '../system/global-location.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

type BranchSeed = {
  idSuffix: string;
  name: string;
  zoneSuffix: string;
  locId: string;
  type: OrgType;
  address: string;
  lat: number;
  lng: number;
};

@Injectable()
export class OrganizationUnitSeeder implements Seeder {
  private readonly logger = new Logger(OrganizationUnitSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting OrganizationUnitSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const branchesToCreate = this.branchesForTenant(tenant.id);

      for (let j = 0; j < branchesToCreate.length; j++) {
        const unit = branchesToCreate[j];
        const orgId = `00000000-0000-7000-8000-00000000${i}${unit.idSuffix}`;
        const zoneId = `00000000-0000-7000-8000-00000000${i}${unit.zoneSuffix}`;

        const existing = await this.prisma.organization_unit.findUnique({
          where: { id: orgId },
        });

        if (!existing) {
          await this.prisma.$executeRaw`
            INSERT INTO organization_unit (id, tenant_id, zone_id, name, org_type, address_line, is_active, updated_at, location)
            VALUES (
              ${orgId}::uuid,
              ${tenant.id}::uuid,
              ${zoneId}::uuid,
              ${unit.name},
              ${unit.type}::"OrgType",
              ${unit.address},
              true,
              NOW(),
              ST_SetSRID(ST_MakePoint(${unit.lng}, ${unit.lat}), 4326)
            )
          `;
        } else {
          await this.prisma.$executeRaw`
            UPDATE organization_unit
            SET
              tenant_id = ${tenant.id}::uuid,
              zone_id = ${zoneId}::uuid,
              name = ${unit.name},
              org_type = ${unit.type}::"OrgType",
              address_line = ${unit.address},
              is_active = true,
              location = ST_SetSRID(ST_MakePoint(${unit.lng}, ${unit.lat}), 4326),
              updated_at = NOW()
            WHERE id = ${orgId}::uuid
          `;
        }

        const mapId = `00000000-0000-7000-8000-00000000${i}55${j}`;

        await this.prisma.org_unit_location_mapping.upsert({
          where: { id: mapId },
          update: {
            tenant_id: tenant.id,
            organization_unit_id: orgId,
            global_location_id: unit.locId,
            coverage_type: 'BOTH',
          },
          create: {
            id: mapId,
            tenant_id: tenant.id,
            organization_unit_id: orgId,
            global_location_id: unit.locId,
            coverage_type: 'BOTH',
          },
        });
      }
    }

    this.logger.log('OrganizationUnitSeeder completed.');
  }

  private branchesForTenant(tenantId: string): BranchSeed[] {
    if (tenantId === SEEDED_TENANTS[0].id) {
      return [
        {
          idSuffix: '501',
          name: 'مركز دمشق الرئيسي',
          zoneSuffix: '301',
          locId: LOCATION.ABU_RUMMANEH,
          type: OrgType.HUB,
          address: 'شارع أبو رمانة، بناء العابد، الطابق الأرضي، دمشق',
          lat: 33.5194,
          lng: 36.2872,
        },
        {
          idSuffix: '504',
          name: 'مستودع المزة',
          zoneSuffix: '301',
          locId: LOCATION.MEZZEH,
          type: OrgType.WAREHOUSE,
          address: 'أتوستراد المزة، مقابل مشفى الرازي، دمشق',
          lat: 33.5047,
          lng: 36.2567,
        },
        {
          idSuffix: '502',
          name: 'فرع حلب — العزيزية',
          zoneSuffix: '302',
          locId: LOCATION.AZIZIEH,
          type: OrgType.BRANCH,
          address: 'شارع العزيزية، بناء الشهابي، حلب',
          lat: 36.2065,
          lng: 37.1543,
        },
        {
          idSuffix: '503',
          name: 'فرع اللاذقية — المشروع العاشر',
          zoneSuffix: '303',
          locId: LOCATION.MASHROU_10,
          type: OrgType.BRANCH,
          address: 'المشروع العاشر، بناء 14، اللاذقية',
          lat: 35.5194,
          lng: 35.7794,
        },
      ];
    }

    if (tenantId === SEEDED_TENANTS[1].id) {
      return [
        {
          idSuffix: '505',
          name: 'مركز بردى — دمشق',
          zoneSuffix: '301',
          locId: LOCATION.MEZZEH,
          type: OrgType.HUB,
          address: 'المزة فيلات غربية، بناء بردى، دمشق',
          lat: 33.5012,
          lng: 36.2591,
        },
        {
          idSuffix: '506',
          name: 'فرع حلب',
          zoneSuffix: '302',
          locId: LOCATION.AZIZIEH,
          type: OrgType.BRANCH,
          address: 'شارع الخندق، جانب جامع التوحيد، حلب',
          lat: 36.2041,
          lng: 37.1488,
        },
        {
          idSuffix: '509',
          name: 'فرع حمص — الإنشاءات',
          zoneSuffix: '303',
          locId: LOCATION.INSHAAT,
          type: OrgType.BRANCH,
          address: 'حي الإنشاءات، شارع الحضارة، حمص',
          lat: 34.7268,
          lng: 36.7076,
        },
      ];
    }

    return [
      {
        idSuffix: '507',
        name: 'مركز الفرات — دير الزور',
        zoneSuffix: '303',
        locId: LOCATION.QUSOUR,
        type: OrgType.HUB,
        address: 'حي القصور، شارع النهر، دير الزور',
        lat: 35.3381,
        lng: 40.1402,
      },
      {
        idSuffix: '508',
        name: 'فرع دمشق',
        zoneSuffix: '301',
        locId: LOCATION.ABU_RUMMANEH,
        type: OrgType.BRANCH,
        address: 'ساحة النجمة، بناء الفرات، دمشق',
        lat: 33.5162,
        lng: 36.2914,
      },
    ];
  }
}
