import { Injectable, Logger } from '@nestjs/common';
import { ServiceLevel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const ZONE = {
  DAMASCUS: '301',
  NORTH: '302',
  COAST: '303',
  CENTER: '304',
  SOUTH: '305',
  EAST: '306',
} as const;

type ZoneInfo = {
  idSuffix: string;
  name: string;
  description: string;
};

const MASARAT_ZONES: ZoneInfo[] = [
  {
    idSuffix: ZONE.DAMASCUS,
    name: 'منطقة دمشق',
    description: 'دمشق وجرمانا والمزة وأبو رمانة والزبلطاني وعدرا',
  },
  {
    idSuffix: ZONE.NORTH,
    name: 'منطقة الشمال',
    description: 'حلب وإدلب والمدن الشمالية',
  },
  {
    idSuffix: ZONE.COAST,
    name: 'منطقة الساحل',
    description: 'اللاذقية وطرطوس',
  },
  {
    idSuffix: ZONE.CENTER,
    name: 'منطقة الوسط',
    description: 'حمص وحماة',
  },
  {
    idSuffix: ZONE.SOUTH,
    name: 'منطقة الجنوب',
    description: 'درعا والسويداء والقنيطرة',
  },
  {
    idSuffix: ZONE.EAST,
    name: 'منطقة الشرق',
    description: 'دير الزور والرقة والحسكة',
  },
];

const QADMOUS_ZONES: ZoneInfo[] = [
  {
    idSuffix: ZONE.DAMASCUS,
    name: 'منطقة دمشق',
    description: 'دمشق وجرمانا',
  },
  {
    idSuffix: ZONE.NORTH,
    name: 'منطقة الشمال',
    description: 'حلب وإدلب',
  },
  {
    idSuffix: ZONE.COAST,
    name: 'منطقة الساحل',
    description: 'طرطوس واللاذقية',
  },
  {
    idSuffix: ZONE.CENTER,
    name: 'منطقة الوسط',
    description: 'حمص وحماة',
  },
];

const TROJAN_ZONES: ZoneInfo[] = [
  {
    idSuffix: ZONE.DAMASCUS,
    name: 'منطقة دمشق',
    description: 'دمشق والزبلطاني',
  },
  {
    idSuffix: ZONE.NORTH,
    name: 'منطقة الشمال',
    description: 'حلب',
  },
  {
    idSuffix: ZONE.CENTER,
    name: 'منطقة الوسط',
    description: 'حمص وحماة',
  },
  {
    idSuffix: ZONE.EAST,
    name: 'منطقة الشرق',
    description: 'دير الزور والرقة والحسكة',
  },
];

const PAIR_BASE_PRICE: Record<string, number> = {
  [`${ZONE.DAMASCUS}-${ZONE.NORTH}`]: 35000,
  [`${ZONE.DAMASCUS}-${ZONE.COAST}`]: 40000,
  [`${ZONE.DAMASCUS}-${ZONE.CENTER}`]: 28000,
  [`${ZONE.DAMASCUS}-${ZONE.SOUTH}`]: 22000,
  [`${ZONE.DAMASCUS}-${ZONE.EAST}`]: 55000,
  [`${ZONE.NORTH}-${ZONE.COAST}`]: 45000,
  [`${ZONE.NORTH}-${ZONE.CENTER}`]: 30000,
  [`${ZONE.NORTH}-${ZONE.SOUTH}`]: 50000,
  [`${ZONE.NORTH}-${ZONE.EAST}`]: 48000,
  [`${ZONE.COAST}-${ZONE.CENTER}`]: 25000,
  [`${ZONE.COAST}-${ZONE.SOUTH}`]: 42000,
  [`${ZONE.COAST}-${ZONE.EAST}`]: 65000,
  [`${ZONE.CENTER}-${ZONE.SOUTH}`]: 32000,
  [`${ZONE.CENTER}-${ZONE.EAST}`]: 50000,
  [`${ZONE.SOUTH}-${ZONE.EAST}`]: 70000,
};

const SERVICE_LEVELS: Array<{ level: ServiceLevel; multiplier: number }> = [
  { level: ServiceLevel.STANDARD, multiplier: 1 },
  { level: ServiceLevel.EXPRESS, multiplier: 1.55 },
  { level: ServiceLevel.SAME_DAY, multiplier: 2.15 },
];

export function zoneIdFor(tenantIndex: number, suffix: string): string {
  return `00000000-0000-7000-8000-00000000${tenantIndex}${suffix}`;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

@Injectable()
export class ZoneSeeder implements Seeder {
  private readonly logger = new Logger(ZoneSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ZoneSeeder...');

    const zonesByTenant = [MASARAT_ZONES, QADMOUS_ZONES, TROJAN_ZONES];

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const zones = zonesByTenant[i];

      for (const zoneInfo of zones) {
        const id = zoneIdFor(i, zoneInfo.idSuffix);
        await this.prisma.tenant_zone.upsert({
          where: { id },
          update: {
            name: zoneInfo.name,
            description: zoneInfo.description,
            is_active: true,
          },
          create: {
            id,
            tenant_id: tenant.id,
            name: zoneInfo.name,
            description: zoneInfo.description,
            is_active: true,
          },
        });
      }

      let matrixIndex = 0;
      for (let a = 0; a < zones.length; a++) {
        for (let b = 0; b < zones.length; b++) {
          if (a === b) {
            continue;
          }

          const originSuffix = zones[a].idSuffix;
          const destSuffix = zones[b].idSuffix;
          const base = PAIR_BASE_PRICE[pairKey(originSuffix, destSuffix)];
          if (!base) {
            continue;
          }

          for (const service of SERVICE_LEVELS) {
            const matrixId = `00000000-0000-7000-8000-00000004${i}${String(matrixIndex).padStart(3, '0')}`;
            matrixIndex += 1;

            await this.prisma.zone_pricing_matrix.upsert({
              where: {
                tenant_id_origin_zone_id_destination_zone_id_service_level: {
                  tenant_id: tenant.id,
                  origin_zone_id: zoneIdFor(i, originSuffix),
                  destination_zone_id: zoneIdFor(i, destSuffix),
                  service_level: service.level,
                },
              },
              update: {
                base_price: Math.round(base * service.multiplier),
                base_weight_kg: 5.0,
                price_per_extra_kg: service.level === ServiceLevel.EXPRESS ? 3500 : 2500,
                is_active: true,
              },
              create: {
                id: matrixId,
                tenant_id: tenant.id,
                origin_zone_id: zoneIdFor(i, originSuffix),
                destination_zone_id: zoneIdFor(i, destSuffix),
                service_level: service.level,
                base_price: Math.round(base * service.multiplier),
                base_weight_kg: 5.0,
                price_per_extra_kg: service.level === ServiceLevel.EXPRESS ? 3500 : 2500,
                is_active: true,
              },
            });
          }
        }
      }
    }

    this.logger.log('ZoneSeeder completed.');
  }
}
