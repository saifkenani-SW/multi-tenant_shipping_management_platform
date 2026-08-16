import { Injectable, Logger } from '@nestjs/common';
import { ServiceLevel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ZONES = [
  {
    idSuffix: '301',
    name: 'منطقة دمشق',
    description: 'دمشق وريف دمشق',
  },
  {
    idSuffix: '302',
    name: 'منطقة حلب',
    description: 'حلب والمدن الشمالية',
  },
  {
    idSuffix: '303',
    name: 'منطقة الساحل والوسط',
    description: 'اللاذقية وحمص ودير الزور',
  },
] as const;

type ZoneMatrix = {
  origin: string;
  dest: string;
  service: ServiceLevel;
  basePrice: number;
  active: boolean;
};

@Injectable()
export class ZoneSeeder implements Seeder {
  private readonly logger = new Logger(ZoneSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ZoneSeeder...');

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const createdZoneIds: string[] = [];

      for (const zoneInfo of SEEDED_ZONES) {
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

      const damascusId = createdZoneIds[0];
      const aleppoId = createdZoneIds[1];
      const coastId = createdZoneIds[2];

      const matrices: ZoneMatrix[] = [];

      if (tenant.id === SEEDED_TENANTS[0].id) {
        matrices.push(
          {
            origin: damascusId,
            dest: aleppoId,
            service: ServiceLevel.STANDARD,
            basePrice: 35000,
            active: true,
          },
          {
            origin: damascusId,
            dest: aleppoId,
            service: ServiceLevel.EXPRESS,
            basePrice: 55000,
            active: true,
          },
          {
            origin: aleppoId,
            dest: damascusId,
            service: ServiceLevel.STANDARD,
            basePrice: 35000,
            active: true,
          },
          {
            origin: damascusId,
            dest: coastId,
            service: ServiceLevel.STANDARD,
            basePrice: 40000,
            active: true,
          },
          {
            origin: damascusId,
            dest: coastId,
            service: ServiceLevel.SAME_DAY,
            basePrice: 75000,
            active: false,
          },
        );
      } else if (tenant.id === SEEDED_TENANTS[1].id) {
        matrices.push(
          {
            origin: damascusId,
            dest: aleppoId,
            service: ServiceLevel.STANDARD,
            basePrice: 32000,
            active: true,
          },
          {
            origin: damascusId,
            dest: coastId,
            service: ServiceLevel.STANDARD,
            basePrice: 36000,
            active: true,
          },
        );
      } else if (tenant.id === SEEDED_TENANTS[2].id) {
        matrices.push(
          {
            origin: damascusId,
            dest: coastId,
            service: ServiceLevel.STANDARD,
            basePrice: 38000,
            active: true,
          },
          {
            origin: damascusId,
            dest: coastId,
            service: ServiceLevel.EXPRESS,
            basePrice: 60000,
            active: true,
          },
          {
            origin: coastId,
            dest: damascusId,
            service: ServiceLevel.STANDARD,
            basePrice: 38000,
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
            price_per_extra_kg: 2500,
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
            price_per_extra_kg: 2500,
            is_active: matrix.active,
          },
        });
      }
    }

    this.logger.log('ZoneSeeder completed.');
  }
}
