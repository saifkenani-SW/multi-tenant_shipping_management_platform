import { Injectable, Logger } from '@nestjs/common';
import { LocationType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const SEEDED_GLOBAL_LOCATIONS = [
  {
    id: '00000000-0000-7000-8000-000000000040',
    parent_id: null,
    name: 'Saudi Arabia',
    type: LocationType.COUNTRY,
    lat: 24.7136,
    lng: 46.6753,
  },
  {
    id: '00000000-0000-7000-8000-000000000041',
    parent_id: '00000000-0000-7000-8000-000000000040',
    name: 'Riyadh Region',
    type: LocationType.GOVERNORATE,
    lat: 24.7136,
    lng: 46.6753,
  },
  {
    id: '00000000-0000-7000-8000-000000000042',
    parent_id: '00000000-0000-7000-8000-000000000041',
    name: 'Riyadh City',
    type: LocationType.CITY,
    lat: 24.7136,
    lng: 46.6753,
  },
  {
    id: '00000000-0000-7000-8000-000000000043',
    parent_id: '00000000-0000-7000-8000-000000000042',
    name: 'Olaya District',
    type: LocationType.DISTRICT,
    lat: 24.6901,
    lng: 46.6853,
  },
  {
    id: '00000000-0000-7000-8000-000000000044',
    parent_id: '00000000-0000-7000-8000-000000000040',
    name: 'Makkah Region',
    type: LocationType.GOVERNORATE,
    lat: 21.3891,
    lng: 39.8579,
  },
  {
    id: '00000000-0000-7000-8000-000000000045',
    parent_id: '00000000-0000-7000-8000-000000000044',
    name: 'Jeddah City',
    type: LocationType.CITY,
    lat: 21.4858,
    lng: 39.1925,
  },
  {
    id: '00000000-0000-7000-8000-000000000046',
    parent_id: '00000000-0000-7000-8000-000000000045',
    name: 'Al-Safa District',
    type: LocationType.DISTRICT,
    lat: 21.5794,
    lng: 39.2081,
  },
  {
    id: '00000000-0000-7000-8000-000000000047',
    parent_id: '00000000-0000-7000-8000-000000000040',
    name: 'Eastern Province',
    type: LocationType.GOVERNORATE,
    lat: 26.4207,
    lng: 50.0888,
  },
  {
    id: '00000000-0000-7000-8000-000000000048',
    parent_id: '00000000-0000-7000-8000-000000000047',
    name: 'Dammam City',
    type: LocationType.CITY,
    lat: 26.4207,
    lng: 50.0888,
  },
  {
    id: '00000000-0000-7000-8000-000000000049',
    parent_id: '00000000-0000-7000-8000-000000000048',
    name: 'Al-Faisaliyah District',
    type: LocationType.DISTRICT,
    lat: 26.3985,
    lng: 50.1189,
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
