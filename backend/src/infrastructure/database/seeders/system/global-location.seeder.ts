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
  JARAMANA: '00000000-0000-7000-8000-000000000060',
  ZABLATANI: '00000000-0000-7000-8000-000000000061',
  SHAALAN: '00000000-0000-7000-8000-000000000062',
  RIF_DIMASHQ_GOV: '00000000-0000-7000-8000-000000000063',
  ADRA: '00000000-0000-7000-8000-000000000064',
  ADRA_INDUSTRIAL: '00000000-0000-7000-8000-000000000065',
  DARAA_GOV: '00000000-0000-7000-8000-000000000066',
  DARAA: '00000000-0000-7000-8000-000000000067',
  DARAA_SABEEL: '00000000-0000-7000-8000-000000000068',
  SWEIDA_GOV: '00000000-0000-7000-8000-000000000069',
  SWEIDA: '00000000-0000-7000-8000-000000000070',
  SWEIDA_MAHATTA: '00000000-0000-7000-8000-000000000071',
  QUNEITRA_GOV: '00000000-0000-7000-8000-000000000072',
  QUNEITRA: '00000000-0000-7000-8000-000000000073',
  BAATH: '00000000-0000-7000-8000-000000000074',
  IDLIB_GOV: '00000000-0000-7000-8000-000000000075',
  IDLIB: '00000000-0000-7000-8000-000000000076',
  IDLIB_DAI: '00000000-0000-7000-8000-000000000077',
  HAMA_GOV: '00000000-0000-7000-8000-000000000078',
  HAMA: '00000000-0000-7000-8000-000000000079',
  HAMA_HAMIDIYE: '00000000-0000-7000-8000-000000000080',
  RAQQA_GOV: '00000000-0000-7000-8000-000000000081',
  RAQQA: '00000000-0000-7000-8000-000000000082',
  RAQQA_THAWRA: '00000000-0000-7000-8000-000000000083',
  HASAKAH_GOV: '00000000-0000-7000-8000-000000000084',
  HASAKAH: '00000000-0000-7000-8000-000000000085',
  HASAKAH_GWEIRAN: '00000000-0000-7000-8000-000000000086',
  ALEPPO_FURQAN: '00000000-0000-7000-8000-000000000087',
  LATAKIA_SHEIKH_DAHIR: '00000000-0000-7000-8000-000000000088',
  HOMS_WAER: '00000000-0000-7000-8000-000000000089',
  TARTOUS_MINA: '00000000-0000-7000-8000-000000000090',
  DEIR_JOURA: '00000000-0000-7000-8000-000000000091',
} as const;

type LocationSeed = {
  id: string;
  parent_id: string | null;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
};

export const SEEDED_GLOBAL_LOCATIONS: LocationSeed[] = [
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
    id: LOCATION.JARAMANA,
    parent_id: LOCATION.DAMASCUS,
    name: 'جرمانا',
    type: LocationType.DISTRICT,
    lat: 33.4873,
    lng: 36.3453,
  },
  {
    id: LOCATION.ZABLATANI,
    parent_id: LOCATION.DAMASCUS,
    name: 'الزبلطاني',
    type: LocationType.DISTRICT,
    lat: 33.5091,
    lng: 36.3184,
  },
  {
    id: LOCATION.SHAALAN,
    parent_id: LOCATION.DAMASCUS,
    name: 'الشعلان',
    type: LocationType.DISTRICT,
    lat: 33.5148,
    lng: 36.2912,
  },
  {
    id: LOCATION.RIF_DIMASHQ_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة ريف دمشق',
    type: LocationType.GOVERNORATE,
    lat: 33.5167,
    lng: 36.4833,
  },
  {
    id: LOCATION.ADRA,
    parent_id: LOCATION.RIF_DIMASHQ_GOV,
    name: 'عدرا',
    type: LocationType.CITY,
    lat: 33.6097,
    lng: 36.515,
  },
  {
    id: LOCATION.ADRA_INDUSTRIAL,
    parent_id: LOCATION.ADRA,
    name: 'عدرا الصناعية',
    type: LocationType.DISTRICT,
    lat: 33.6124,
    lng: 36.5211,
  },
  {
    id: LOCATION.DARAA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة درعا',
    type: LocationType.GOVERNORATE,
    lat: 32.6189,
    lng: 36.1021,
  },
  {
    id: LOCATION.DARAA,
    parent_id: LOCATION.DARAA_GOV,
    name: 'درعا',
    type: LocationType.CITY,
    lat: 32.6189,
    lng: 36.1021,
  },
  {
    id: LOCATION.DARAA_SABEEL,
    parent_id: LOCATION.DARAA,
    name: 'حي السبيل',
    type: LocationType.DISTRICT,
    lat: 32.6254,
    lng: 36.1088,
  },
  {
    id: LOCATION.SWEIDA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة السويداء',
    type: LocationType.GOVERNORATE,
    lat: 32.7089,
    lng: 36.5695,
  },
  {
    id: LOCATION.SWEIDA,
    parent_id: LOCATION.SWEIDA_GOV,
    name: 'السويداء',
    type: LocationType.CITY,
    lat: 32.7089,
    lng: 36.5695,
  },
  {
    id: LOCATION.SWEIDA_MAHATTA,
    parent_id: LOCATION.SWEIDA,
    name: 'حي المحطة',
    type: LocationType.DISTRICT,
    lat: 32.7122,
    lng: 36.5731,
  },
  {
    id: LOCATION.QUNEITRA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة القنيطرة',
    type: LocationType.GOVERNORATE,
    lat: 33.1266,
    lng: 35.8246,
  },
  {
    id: LOCATION.QUNEITRA,
    parent_id: LOCATION.QUNEITRA_GOV,
    name: 'القنيطرة',
    type: LocationType.CITY,
    lat: 33.1266,
    lng: 35.8246,
  },
  {
    id: LOCATION.BAATH,
    parent_id: LOCATION.QUNEITRA,
    name: 'مدينة البعث',
    type: LocationType.DISTRICT,
    lat: 33.1981,
    lng: 35.8964,
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
    id: LOCATION.ALEPPO_FURQAN,
    parent_id: LOCATION.ALEPPO,
    name: 'الفرقان',
    type: LocationType.DISTRICT,
    lat: 36.2168,
    lng: 37.1189,
  },
  {
    id: LOCATION.IDLIB_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة إدلب',
    type: LocationType.GOVERNORATE,
    lat: 35.9306,
    lng: 36.6339,
  },
  {
    id: LOCATION.IDLIB,
    parent_id: LOCATION.IDLIB_GOV,
    name: 'إدلب',
    type: LocationType.CITY,
    lat: 35.9306,
    lng: 36.6339,
  },
  {
    id: LOCATION.IDLIB_DAI,
    parent_id: LOCATION.IDLIB,
    name: 'الضاحية',
    type: LocationType.DISTRICT,
    lat: 35.9362,
    lng: 36.6411,
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
    id: LOCATION.LATAKIA_SHEIKH_DAHIR,
    parent_id: LOCATION.LATAKIA,
    name: 'الشيخ ضاهر',
    type: LocationType.DISTRICT,
    lat: 35.5241,
    lng: 35.7833,
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
  {
    id: LOCATION.TARTOUS_MINA,
    parent_id: LOCATION.TARTOUS,
    name: 'الميناء',
    type: LocationType.DISTRICT,
    lat: 34.8924,
    lng: 35.8788,
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
    id: LOCATION.HOMS_WAER,
    parent_id: LOCATION.HOMS,
    name: 'الوعر',
    type: LocationType.DISTRICT,
    lat: 34.7456,
    lng: 36.6789,
  },
  {
    id: LOCATION.HAMA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة حماة',
    type: LocationType.GOVERNORATE,
    lat: 35.1318,
    lng: 36.7578,
  },
  {
    id: LOCATION.HAMA,
    parent_id: LOCATION.HAMA_GOV,
    name: 'حماة',
    type: LocationType.CITY,
    lat: 35.1318,
    lng: 36.7578,
  },
  {
    id: LOCATION.HAMA_HAMIDIYE,
    parent_id: LOCATION.HAMA,
    name: 'الحميدية',
    type: LocationType.DISTRICT,
    lat: 35.1372,
    lng: 36.7491,
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
    id: LOCATION.DEIR_JOURA,
    parent_id: LOCATION.DEIR_EZ_ZOR,
    name: 'الجورة',
    type: LocationType.DISTRICT,
    lat: 35.3294,
    lng: 40.1488,
  },
  {
    id: LOCATION.RAQQA_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة الرقة',
    type: LocationType.GOVERNORATE,
    lat: 35.9503,
    lng: 39.0089,
  },
  {
    id: LOCATION.RAQQA,
    parent_id: LOCATION.RAQQA_GOV,
    name: 'الرقة',
    type: LocationType.CITY,
    lat: 35.9503,
    lng: 39.0089,
  },
  {
    id: LOCATION.RAQQA_THAWRA,
    parent_id: LOCATION.RAQQA,
    name: 'الثورة',
    type: LocationType.DISTRICT,
    lat: 35.8367,
    lng: 38.5481,
  },
  {
    id: LOCATION.HASAKAH_GOV,
    parent_id: LOCATION.SYRIA,
    name: 'محافظة الحسكة',
    type: LocationType.GOVERNORATE,
    lat: 36.5024,
    lng: 40.7477,
  },
  {
    id: LOCATION.HASAKAH,
    parent_id: LOCATION.HASAKAH_GOV,
    name: 'الحسكة',
    type: LocationType.CITY,
    lat: 36.5024,
    lng: 40.7477,
  },
  {
    id: LOCATION.HASAKAH_GWEIRAN,
    parent_id: LOCATION.HASAKAH,
    name: 'غويران',
    type: LocationType.DISTRICT,
    lat: 36.5088,
    lng: 40.7392,
  },
];

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
