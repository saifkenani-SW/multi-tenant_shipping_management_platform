import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface TripLocationEntry {
  tripId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  recordedAt: Date;
}

@Injectable()
export class TripLocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(entries: TripLocationEntry[]): Promise<void> {
    if (entries.length === 0) return;

    await this.prisma.trip_location_log.createMany({
      data: entries.map((e) => ({
        trip_id: e.tripId,
        driver_id: e.driverId,
        latitude: e.latitude,
        longitude: e.longitude,
        recorded_at: e.recordedAt,
      })),
    });
  }
}
