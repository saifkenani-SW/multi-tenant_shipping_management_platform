import { Injectable, Logger } from '@nestjs/common';
import { LocationType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const LOCATION = {
  SYRIA: '00000000-0000-7000-8000-000000000040',
  DAMASCUS_GOV: '00000000-0000-7000-8000-000000000041',
  DAMASCUS: '00000000-0000-7000-8000-000000000042',
  ABU_RUMMANEH: '00000000-0000-7000-8000-000000000043',
  ALEPPO_GOV: '00000000-0000-7000-8000-000000000044',
  ALEPPO: '00000000-0000-7000-8000-000000000045',
  AZIZIEH: '00000000-0000-7000-8000-000000000046',
  LATAKIA_GOV: '00000000-0000-7000-8000-000000000047',
  LATAKIA: '00000000-0000-7000-8000-000000000048',
  MASHROU_10: '00000000-0000-7000-8000-000000000049',
  HOMS_GOV: '00000000-0000-7000-8000-000000000050',
  HOMS: '00000000-0000-7000-8000-000000000051',
  INSHAAT: '00000000-0000-7000-8000-000000000052',
  MEZZEH: '00000000-0000-7000-8000-000000000053',
  DEIR_EZ_ZOR_GOV: '00000000-0000-7000-8000-000000000054',
  DEIR_EZ_ZOR: '00000000-0000-7000-8000-000000000055',
  QUSOUR: '00000000-0000-7000-8000-000000000056',
  TARTOUS_GOV: '00000000-0000-7000-8000-000000000057',
  TARTOUS: '00000000-0000-7000-8000-000000000058',
  TARTOUS_CORNICHE: '00000000-0000-7000-8000-000000000059',
} as const;

export const SEEDED_GLOBAL_LOCATIONS = [
  {
    id: LOCATION.SYRIA,
    parent_id: null,
    name: 'سوريا',
    type: LocationType.COUNTRY,
    lat: 34.8021,
    lng: 38.9968,
  },
  {
    id: LOCATION.DAMASCUS_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة دمشق',
    type: LocationType.GOVERNORATE,
    lat: 33.5138,
    lng: 36.2765,
  },
  {
    id: LOCATION.DAMASCUS,
    parent_id: LOCATION.DAMASCUS_GOV,
    name: 'دمشق',
    type: LocationType.CITY,
    lat: 33.5138,
    lng: 36.2765,
  },
  {
    id: LOCATION.ABU_RUMMANEH,
    parent_id: LOCATION.DAMASCUS,
    name: 'أبو رمانة',
    type: LocationType.DISTRICT,
    lat: 33.5194,
    lng: 36.2872,
  },
  {
    id: LOCATION.MEZZEH,
    parent_id: LOCATION.DAMASCUS,
    name: 'المزة',
    type: LocationType.DISTRICT,
    lat: 33.5047,
    lng: 36.2567,
  },
  {
    id: LOCATION.ALEPPO_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة حلب',
    type: LocationType.GOVERNORATE,
    lat: 36.2021,
    lng: 37.1343,
  },
  {
    id: LOCATION.ALEPPO,
    parent_id: LOCATION.ALEPPO_GOV,
    name: 'حلب',
    type: LocationType.CITY,
    lat: 36.2021,
    lng: 37.1343,
  },
  {
    id: LOCATION.AZIZIEH,
    parent_id: LOCATION.ALEPPO,
    name: 'العزيزية',
    type: LocationType.DISTRICT,
    lat: 36.2065,
    lng: 37.1543,
  },
  {
    id: LOCATION.LATAKIA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة اللاذقية',
    type: LocationType.GOVERNORATE,
    lat: 35.5317,
    lng: 35.7906,
  },
  {
    id: LOCATION.LATAKIA,
    parent_id: LOCATION.LATAKIA_GOV,
    name: 'اللاذقية',
    type: LocationType.CITY,
    lat: 35.5317,
    lng: 35.7906,
  },
  {
    id: LOCATION.MASHROU_10,
    parent_id: LOCATION.LATAKIA,
    name: 'المشروع العاشر',
    type: LocationType.DISTRICT,
    lat: 35.5194,
    lng: 35.7794,
  },
  {
    id: LOCATION.HOMS_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة حمص',
    type: LocationType.GOVERNORATE,
    lat: 34.7324,
    lng: 36.7137,
  },
  {
    id: LOCATION.HOMS,
    parent_id: LOCATION.HOMS_GOV,
    name: 'حمص',
    type: LocationType.CITY,
    lat: 34.7324,
    lng: 36.7137,
  },
  {
    id: LOCATION.INSHAAT,
    parent_id: LOCATION.HOMS,
    name: 'الإنشاءات',
    type: LocationType.DISTRICT,
    lat: 34.7268,
    lng: 36.7076,
  },
  {
    id: LOCATION.DEIR_EZ_ZOR_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة دير الزور',
    type: LocationType.GOVERNORATE,
    lat: 35.3333,
    lng: 40.15,
  },
  {
    id: LOCATION.DEIR_EZ_ZOR,
    parent_id: LOCATION.DEIR_EZ_ZOR_GOV,
    name: 'دير الزور',
    type: LocationType.CITY,
    lat: 35.3333,
    lng: 40.15,
  },
  {
    id: LOCATION.QUSOUR,
    parent_id: LOCATION.DEIR_EZ_ZOR,
    name: 'حي القصور',
    type: LocationType.DISTRICT,
    lat: 35.3381,
    lng: 40.1402,
  },
  {
    id: LOCATION.TARTOUS_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة طرطوس',
    type: LocationType.GOVERNORATE,
    lat: 34.895,
    lng: 35.8866,
  },
  {
    id: LOCATION.TARTOUS,
    parent_id: LOCATION.TARTOUS_GOV,
    name: 'طرطوس',
    type: LocationType.CITY,
    lat: 34.895,
    lng: 35.8866,
  },
  {
    id: LOCATION.TARTOUS_CORNICHE,
    parent_id: LOCATION.TARTOUS,
    name: 'الكورنيش',
    type: LocationType.DISTRICT,
    lat: 34.8892,
    lng: 35.8861,
  },
] as const;

@Injectable()
export class GlobalLocationSeeder implements Seeder {
  private readonly logger = new Logger(GlobalLocationSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting GlobalLocationSeeder...');

    for (const loc of SEEDED_GLOBAL_LOCATIONS) {
      const existing = await this.prisma.global_location.findUnique({
        where: { id: loc.id },
      });

      if (!existing) {
        await this.prisma.$executeRaw`
          INSERT INTO global_location (id, parent_id, name, type, location)
          VALUES (
            ${loc.id}::uuid,
            ${loc.parent_id ? loc.parent_id : null}::uuid,
            ${loc.name},
            ${loc.type}::"LocationType",
            ST_SetSRID(ST_MakePoint(${loc.lng}, ${loc.lat}), 4326)
          )
        `;
      } else {
        await this.prisma.$executeRaw`
          UPDATE global_location
          SET
            parent_id = ${loc.parent_id ? loc.parent_id : null}::uuid,
            name = ${loc.name},
            type = ${loc.type}::"LocationType",
            location = ST_SetSRID(ST_MakePoint(${loc.lng}, ${loc.lat}), 4326)
          WHERE id = ${loc.id}::uuid
        `;
      }
    }

    this.logger.log('GlobalLocationSeeder completed.');
  }
}
