import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ZONES = [
  { idSuffix: '301', name: 'Central Zone', description: 'Riyadh Central Area' },
  {
    idSuffix: '302',
    name: 'Western Zone',
    description: 'Jeddah & Coastal Area',
  },
  { idSuffix: '303', name: 'Eastern Zone', description: 'Dammam Area' },
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

      const centralId = createdZoneIds[0];
      const westernId = createdZoneIds[1];
      const easternId = createdZoneIds[2];

      const matrices: any[] = [];

      if (tenant.name === 'FastShip Logistics') {
        matrices.push(
          {
            origin: centralId,
            dest: westernId,
            service: 'STANDARD',
            basePrice: 25.0,
            active: true,
          },
          {
            origin: centralId,
            dest: westernId,
            service: 'EXPRESS',
            basePrice: 40.0,
            active: true,
          },
          {
            origin: westernId,
            dest: centralId,
            service: 'STANDARD',
            basePrice: 25.0,
            active: true,
          },
          {
            origin: centralId,
            dest: easternId,
            service: 'STANDARD',
            basePrice: 30.0,
            active: true,
          },
          {
            origin: centralId,
            dest: easternId,
            service: 'SAME_DAY',
            basePrice: 50.0,
            active: false,
          },
        );
      } else if (tenant.name === 'QuickDelivery Co.') {
        matrices.push(
          {
            origin: centralId,
            dest: westernId,
            service: 'STANDARD',
            basePrice: 20.0,
            active: true,
          },
          {
            origin: centralId,
            dest: easternId,
            service: 'STANDARD',
            basePrice: 22.0,
            active: true,
          },
        );
      } else if (tenant.name === 'GlobalFreight Co.') {
        matrices.push(
          {
            origin: centralId,
            dest: easternId,
            service: 'STANDARD',
            basePrice: 28.0,
            active: true,
          },
          {
            origin: centralId,
            dest: easternId,
            service: 'EXPRESS',
            basePrice: 50.0,
            active: true,
          },
          {
            origin: easternId,
            dest: centralId,
            service: 'STANDARD',
            basePrice: 28.0,
            active: true,
          },
        );
      }

      for (let m = 0; m < matrices.length; m++) {
        const matrix = matrices[m];
        const matrixId = `00000000-0000-7000-8000-0000000004${i}${m}`;

        await this.prisma.zone_pricing_matrix.upsert({
          where: {
            tenant_id_origin_zone_id_destination_zone_id_service_level: {
              tenant_id: tenant.id,
              origin_zone_id: matrix.origin,
              destination_zone_id: matrix.dest,
              service_level: matrix.service,
            },
          },
          update: {
            base_price: matrix.basePrice,
            base_weight_kg: 5.0,
            price_per_extra_kg: 2.5,
            is_active: matrix.active,
          },
          create: {
            id: matrixId,
            tenant_id: tenant.id,
            origin_zone_id: matrix.origin,
            destination_zone_id: matrix.dest,
            service_level: matrix.service,
            base_price: matrix.basePrice,
            base_weight_kg: 5.0,
            price_per_extra_kg: 2.5,
            is_active: matrix.active,
          },
        });
      }
    }

    this.logger.log('ZoneSeeder completed.');
  }
}
