import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';

@Injectable()
export class TrackingQueryRepository {
  constructor(@Inject('KYSELY_INSTANCE') private readonly db: Kysely<DB>) {}

  async getParcelHistory(parcelId: string) {
    return this.db
      .selectFrom('parcel_movement')
      .selectAll('parcel_movement')
      .where('parcel_id', '=', parcelId)
      .orderBy('created_at', 'desc')
      .execute();
  }
}
