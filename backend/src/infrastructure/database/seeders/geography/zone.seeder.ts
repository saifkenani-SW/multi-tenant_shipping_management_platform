import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ZONES = [
  { idSuffix: '301', name: 'Central Zone', description: 'Riyadh Central Area' },
  { idSuffix: '302', name: 'Western Zone', description: 'Jeddah & Coastal Area' },
] as const;

@Injectable()
export class ZoneSeeder implements Seeder {
  private readonly logger = new Logger(ZoneSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ZoneSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];

      const createdZoneIds: string[] = [];

      for (let j = 0; j < SEEDED_ZONES.length; j++) {
        const zoneInfo = SEEDED_ZONES[j];
        const zoneId = `00000000-0000-7000-8000-00000000${i}${zoneInfo.idSuffix}`;

        const zone = await this.prisma.tenant_zone.upsert({
          where: { id: zoneId },
          update: {
            name: zoneInfo.name,
            description: zoneInfo.description,
            is_active: true,
          },
          create: {
            id: zoneId,
            tenant_id: tenant.id,
            name: zoneInfo.name,
            description: zoneInfo.description,
            is_active: true,
          },
        });
        createdZoneIds.push(zone.id);
      }

      if (createdZoneIds.length >= 2) {
        const originZoneId = createdZoneIds[0];
        const destZoneId = createdZoneIds[1];
        const matrixId = `00000000-0000-7000-8000-0000000004${i}1`;

        await this.prisma.zone_pricing_matrix.upsert({
          where: {
            tenant_id_origin_zone_id_destination_zone_id: {
              tenant_id: tenant.id,
              origin_zone_id: originZoneId,
              destination_zone_id: destZoneId,
            },
          },
          update: {
            base_price: 25.0,
            base_weight_kg: 5.0,
            price_per_extra_kg: 2.5,
            is_active: true,
          },
          create: {
            id: matrixId,
            tenant_id: tenant.id,
            origin_zone_id: originZoneId,
            destination_zone_id: destZoneId,
            base_price: 25.0,
            base_weight_kg: 5.0,
            price_per_extra_kg: 2.5,
            is_active: true,
          },
        });
      }
    }

    this.logger.log('ZoneSeeder completed.');
  }
}
