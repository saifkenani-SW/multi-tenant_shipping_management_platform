import { Injectable } from '@nestjs/common';
import { ProofOfDeliveryResponseDto } from '../dtos/responses/proof-of-delivery.response.dto';

@Injectable()
export class ProofOfDeliveryMapper {
  toResponse(record: any): ProofOfDeliveryResponseDto {
    return {
      id: record.id,
      tenantId: record.tenant_id,
      parcelId: record.parcel_id,
      deliveredByEmployeeId: record.delivered_by_employee_id,
      collectionMethod: record.collection_method,
      receivedByName: record.received_by_name,
      receivedByNationalId: record.received_by_national_id ?? null,
      otpVerified: record.otp_verified,
      otpVerifiedAt: record.otp_verified_at ?? null,
      signatureKey: record.signature_key ?? null,
      idPhotoKey: record.id_photo_key ?? null,
      parcelPhotoKey: record.parcel_photo_key ?? null,
      additionalPhotoKey: record.additional_photo_key ?? null,
      deliveryLat:
        record.delivery_lat === null || record.delivery_lat === undefined
          ? null
          : Number(record.delivery_lat),
      deliveryLng:
        record.delivery_lng === null || record.delivery_lng === undefined
          ? null
          : Number(record.delivery_lng),
      createdAt: record.created_at,
    };
  }
}
