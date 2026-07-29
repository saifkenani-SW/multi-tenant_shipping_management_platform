import { Injectable, Logger } from '@nestjs/common';
import { OrgType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_GLOBAL_LOCATIONS } from '../system/global-location.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ORG_UNITS = [
  {
    idSuffix: '501',
    name: 'Riyadh Main Hub',
    org_type: OrgType.HUB,
    address: 'King Fahd Road, Riyadh',
    lat: 24.7136,
    lng: 46.6753,
  },
  {
    idSuffix: '502',
    name: 'Olaya Branch',
    org_type: OrgType.BRANCH,
    address: 'Olaya Street, Riyadh',
    lat: 24.6901,
    lng: 46.6853,
  },
] as const;

@Injectable()
export class OrganizationUnitSeeder implements Seeder {
  private readonly logger = new Logger(OrganizationUnitSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting OrganizationUnitSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const zone = await this.prisma.tenant_zone.findFirst({
        where: { tenant_id: tenant.id },
      });

      for (let j = 0; j < SEEDED_ORG_UNITS.length; j++) {
        const unit = SEEDED_ORG_UNITS[j];
        const orgId = `00000000-0000-7000-8000-00000000${i}${unit.idSuffix}`;

        const existing = await this.prisma.organization_unit.findUnique({
          where: { id: orgId },
        });

        if (!existing) {
          await this.prisma.$executeRaw`
            INSERT INTO organization_unit (id, tenant_id, zone_id, name, org_type, address_line, is_active, updated_at, location)
            VALUES (
              ${orgId}::uuid,
              ${tenant.id}::uuid,
              ${zone ? zone.id : null}::uuid,
              ${unit.name},
              ${unit.org_type}::"OrgType",
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
              zone_id = ${zone ? zone.id : null}::uuid,
              name = ${unit.name},
              org_type = ${unit.org_type}::"OrgType",
              address_line = ${unit.address},
              is_active = true,
              updated_at = NOW(),
              location = ST_SetSRID(ST_MakePoint(${unit.lng}, ${unit.lat}), 4326)
            WHERE id = ${orgId}::uuid
          `;
        }

        // Map to global_location
        const globalLocId = SEEDED_GLOBAL_LOCATIONS[3].id; // Olaya District
        const mapId = `00000000-0000-7000-8000-00000000${i}55${j}`;

        await this.prisma.org_unit_location_mapping.upsert({
          where: {
            organization_unit_id_global_location_id: {
              organization_unit_id: orgId,
              global_location_id: globalLocId,
            },
          },
          update: { coverage_type: 'DELIVERY_AREA' },
          create: {
            id: mapId,
            tenant_id: tenant.id,
            organization_unit_id: orgId,
            global_location_id: globalLocId,
            coverage_type: 'DELIVERY_AREA',
          },
        });
      }
    }

    this.logger.log('OrganizationUnitSeeder completed.');
  }
}
