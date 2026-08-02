import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { Parcel } from '../../domain/entities/parcel.entity';

@Injectable()
export class ParcelQueryRepository {
  constructor(@Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>) {}

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
      record.updated_at,
    );
  }

  async findLabelDataByTrackingNumber(trackingNumber: string) {
    const record = await this.kysely
      .selectFrom('parcel')
      .innerJoin(
        'customer_shipment',
        'customer_shipment.id',
        'parcel.customer_shipment_id',
      )
      .leftJoin(
        'customer_profile as sender',
        'sender.id',
        'customer_shipment.sender_customer_profile_id',
      )
      .leftJoin(
        'customer_profile as receiver',
        'receiver.id',
        'customer_shipment.receiver_customer_profile_id',
      )
      .select([
        'parcel.tracking_number',
        'parcel.actual_weight_kg',
        'parcel.length_cm',
        'parcel.width_cm',
        'parcel.height_cm',
        'customer_shipment.id as shipment_id',
        'sender.full_name as sender_name',
        'customer_shipment.receiver_name',
        'sender.phone as sender_phone',
        'customer_shipment.receiver_phone as receiver_phone',
      ])
      .where('parcel.tracking_number', '=', trackingNumber)
      .executeTakeFirst();

    return record || null;
  }
}
