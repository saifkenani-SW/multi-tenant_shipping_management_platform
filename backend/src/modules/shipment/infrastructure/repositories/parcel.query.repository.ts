import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { Parcel } from '../../domain/entities/parcel.entity';

@Injectable()
export class ParcelQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>,
  ) {}

  async findByTrackingNumber(trackingNumber: string): Promise<Parcel | null> {
    const record = await this.kysely
      .selectFrom('parcel')
      .selectAll()
      .where('tracking_number', '=', trackingNumber)
      .executeTakeFirst();

    if (!record) {
      return null;
    }

    return new Parcel(
      record.id,
      record.tenant_id,
      record.customer_shipment_id,
      record.tracking_number,
      Number(record.actual_weight_kg),
      Number(record.length_cm),
      Number(record.width_cm),
      Number(record.height_cm),
      record.current_status as any,
      record.current_condition as any,
      record.current_org_unit_id,
      record.volumetric_weight_kg ? Number(record.volumetric_weight_kg) : null,
      record.created_at,
      record.updated_at
    );
  }
}
