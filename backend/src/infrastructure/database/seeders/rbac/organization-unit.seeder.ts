import { Injectable, Logger } from '@nestjs/common';
import { OrgType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_GLOBAL_LOCATIONS } from '../system/global-location.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ORG_UNITS = [] as const; // We will generate them dynamically below

@Injectable()
export class OrganizationUnitSeeder implements Seeder {
  private readonly logger = new Logger(OrganizationUnitSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting OrganizationUnitSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];

      // Fetch the zones for this tenant
      const zones = await this.prisma.tenant_zone.findMany({
        where: { tenant_id: tenant.id },
        orderBy: { name: 'asc' }, // Central, Eastern, Western
      });
      const centralZone = zones.find(z => z.name === 'Central Zone');
      const easternZone = zones.find(z => z.name === 'Eastern Zone');
      const westernZone = zones.find(z => z.name === 'Western Zone');

      // Fetch global locations
      const olaya = SEEDED_GLOBAL_LOCATIONS.find(l => l.name === 'Olaya District');
      const safa = SEEDED_GLOBAL_LOCATIONS.find(l => l.name === 'Al-Safa District');
      const faisaliyah = SEEDED_GLOBAL_LOCATIONS.find(l => l.name === 'Al-Faisaliyah District');

      const branchesToCreate: any[] = [];

      if (tenant.name === 'FastShip Logistics') {
        branchesToCreate.push(
          { idSuffix: '501', name: 'Branch 1 (Riyadh Hub)', zoneId: centralZone?.id, locId: olaya?.id, type: OrgType.HUB },
          { idSuffix: '504', name: 'Branch 4 (Riyadh Hub 2)', zoneId: centralZone?.id, locId: olaya?.id, type: OrgType.HUB },
          { idSuffix: '502', name: 'Branch 2 (Jeddah Branch)', zoneId: westernZone?.id, locId: safa?.id, type: OrgType.BRANCH },
          { idSuffix: '503', name: 'Branch 3 (Dammam Branch)', zoneId: easternZone?.id, locId: faisaliyah?.id, type: OrgType.BRANCH }
        );
      } else if (tenant.name === 'QuickDelivery Co.') {
        branchesToCreate.push(
          { idSuffix: '505', name: 'Branch 5 (Riyadh Hub)', zoneId: centralZone?.id, locId: olaya?.id, type: OrgType.HUB },
          { idSuffix: '506', name: 'Branch 6 (Jeddah Branch)', zoneId: westernZone?.id, locId: safa?.id, type: OrgType.BRANCH },
          { idSuffix: '509', name: 'Branch 7 (Dammam Branch)', zoneId: easternZone?.id, locId: faisaliyah?.id, type: OrgType.BRANCH }
        );
      } else if (tenant.name === 'GlobalFreight Co.') {
        branchesToCreate.push(
          { idSuffix: '507', name: 'Global Riyadh Hub', zoneId: centralZone?.id, locId: olaya?.id, type: OrgType.HUB },
          { idSuffix: '508', name: 'Global Dammam Branch', zoneId: easternZone?.id, locId: faisaliyah?.id, type: OrgType.BRANCH }
        );
      }

      for (let j = 0; j < branchesToCreate.length; j++) {
        const unit = branchesToCreate[j];
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
              ${unit.zoneId}::uuid,
              ${unit.name},
              ${unit.type}::"OrgType",
              'Test Address',
              true,
              NOW(),
              ST_SetSRID(ST_MakePoint(46.6753, 24.7136), 4326)
            )
          `;
        } else {
          await this.prisma.$executeRaw`
            UPDATE organization_unit
            SET
              tenant_id = ${tenant.id}::uuid,
              zone_id = ${unit.zoneId}::uuid,
              name = ${unit.name},
              org_type = ${unit.type}::"OrgType",
              is_active = true,
              updated_at = NOW()
            WHERE id = ${orgId}::uuid
          `;
        }

        // Map to global_location
        if (unit.locId) {
          const mapId = `00000000-0000-7000-8000-00000000${i}55${j}`;

          await this.prisma.org_unit_location_mapping.upsert({
            where: {
              organization_unit_id_global_location_id: {
                organization_unit_id: orgId,
                global_location_id: unit.locId,
              },
            },
            update: { coverage_type: 'BOTH' },
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
    }

    this.logger.log('OrganizationUnitSeeder completed.');
  }
}
