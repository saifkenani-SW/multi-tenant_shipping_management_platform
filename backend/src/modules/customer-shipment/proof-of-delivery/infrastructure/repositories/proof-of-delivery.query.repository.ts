import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';

const POD_COLUMNS = [
  'pod.id',
  'pod.tenant_id',
  'pod.parcel_id',
  'pod.delivered_by_employee_id',
  'pod.collection_method',
  'pod.received_by_name',
  'pod.received_by_national_id',
  'pod.otp_verified',
  'pod.otp_verified_at',
  'pod.signature_key',
  'pod.id_photo_key',
  'pod.parcel_photo_key',
  'pod.additional_photo_key',
  'pod.delivery_lat',
  'pod.delivery_lng',
  'pod.created_at',
] as const;

@Injectable()
export class ProofOfDeliveryQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  /**
   * Joined with the owning shipment so the caller can check either the tenant
   * or the sending customer without a second query.
   */
  async findByParcelId(parcelId: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('proof_of_delivery as pod')
      .innerJoin('parcel as p', 'p.id', 'pod.parcel_id')
      .innerJoin('customer_shipment as cs', 'cs.id', 'p.customer_shipment_id')
      .select([...POD_COLUMNS])
      .select(['cs.sender_customer_profile_id'])
      .where('pod.parcel_id', '=', parcelId)
      .executeTakeFirst();

    return record ?? null;
  }

  /**
   * Joins through the parcel to locate the POD by tracking number.
   * Used by employee-facing endpoints where the device scans the QR / barcode.
   */
  async findByTrackingNumber(trackingNumber: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('proof_of_delivery as pod')
      .innerJoin('parcel as p', 'p.id', 'pod.parcel_id')
      .innerJoin('customer_shipment as cs', 'cs.id', 'p.customer_shipment_id')
      .select([...POD_COLUMNS])
      .select(['cs.sender_customer_profile_id', 'p.tenant_id as p_tenant_id'])
      .where('p.tracking_number', '=', trackingNumber)
      .executeTakeFirst();

    return record ?? null;
  }


  async existsForParcel(parcelId: string): Promise<boolean> {
    const record = await this.kysely
      .selectFrom('proof_of_delivery')
      .select('id')
      .where('parcel_id', '=', parcelId)
      .executeTakeFirst();

    return Boolean(record);
  }
}
