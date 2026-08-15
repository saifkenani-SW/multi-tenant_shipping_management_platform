import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';

import {
  TripLocationEntry,
  TripLocationRepository,
} from '../../infrastructure/repositories/trip-location.repository';

const LOCATION_KEY_PREFIX = 'trip:locations:';

/**
 * Periodically flushes buffered driver GPS coordinates from Redis into the
 * `trip_location_log` table.
 *
 * Redis buffer key format: `trip:locations:{tripId}`
 * Each list entry is a JSON-serialised `TripLocationEntry`.
 *
 * The flush uses LRANGE + LTRIM inside a MULTI/EXEC transaction to
 * atomically drain each list, preventing data loss under concurrent writes.
 */
@Injectable()
export class LocationFlusherService {
  private readonly logger = new Logger(LocationFlusherService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly tripLocationRepository: TripLocationRepository,
  ) {}

  /**
   * Runs every 2 minutes.
   * Scans all active trip location keys and bulk-inserts them into the DB.
   */
  @Cron('*/2 * * * *')
  async flush(): Promise<void> {
    const keys = await this.scanLocationKeys();

    if (keys.length === 0) return;

    this.logger.debug(`Flushing location buffers for ${keys.length} trip(s)`);

    for (const key of keys) {
      await this.flushKey(key);
    }
  }

  private async scanLocationKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        `${LOCATION_KEY_PREFIX}*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  private async flushKey(key: string): Promise<void> {
    try {
      /*
       * Atomically read and clear the list.
       * LRANGE returns all entries; LTRIM with impossible range (1,0) clears the list.
       */
      const results = await this.redis
        .multi()
        .lrange(key, 0, -1)
        .ltrim(key, 1, 0)
        .exec();

      if (!results || results.length === 0) return;

      const [lrangeError, rawEntries] = results[0];

      if (lrangeError) {
        this.logger.error(`LRANGE error for ${key}`, lrangeError);
        return;
      }

      const entries = (rawEntries as string[])
        .map((raw) => {
          try {
            return JSON.parse(raw) as TripLocationEntry;
          } catch {
            this.logger.warn(`Failed to parse location entry: ${raw}`);
            return null;
          }
        })
        .filter((e): e is TripLocationEntry => e !== null);

      if (entries.length > 0) {
        await this.tripLocationRepository.createMany(entries);
        this.logger.debug(`Persisted ${entries.length} locations from ${key}`);
      }
    } catch (err) {
      this.logger.error(`Failed to flush location key ${key}`, err);
    }
  }

  /**
   * Exposed for the gateway: pushes a single location entry to the Redis
   * buffer for the given trip.
   */
  async buffer(entry: TripLocationEntry): Promise<void> {
    const key = `${LOCATION_KEY_PREFIX}${entry.tripId}`;
    await this.redis.rpush(key, JSON.stringify(entry));
  }
}
