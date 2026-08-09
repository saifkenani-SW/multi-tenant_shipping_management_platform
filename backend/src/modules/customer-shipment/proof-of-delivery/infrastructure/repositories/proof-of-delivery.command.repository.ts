import { Injectable } from '@nestjs/common';
import { CollectionMethod } from '@prisma/client';
import { TransactionalPrismaService } from '../../../../../packages/transaction';

export interface CreateProofOfDeliveryData {
  tenantId: string;
  parcelId: string;
  deliveredByEmployeeId: string;
  collectionMethod: CollectionMethod;
  receivedByName: string;
  receivedByNationalId: string | null;
  otpVerified: boolean;
  otpVerifiedAt: Date | null;
  signatureKey: string | null;
  idPhotoKey: string | null;
  parcelPhotoKey: string | null;
  additionalPhotoKey: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
}

/**
 * Proof of delivery is immutable business history: this repository inserts and
 * nothing else. There is deliberately no update or delete.
 */
@Injectable()
export class ProofOfDeliveryCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateProofOfDeliveryData): Promise<{ id: string }> {
    return this.prisma.client.proof_of_delivery.create({
      data: {
        tenant_id: data.tenantId,
        parcel_id: data.parcelId,
        delivered_by_employee_id: data.deliveredByEmployeeId,
        collection_method: data.collectionMethod,
        received_by_name: data.receivedByName,
        received_by_national_id: data.receivedByNationalId,
        otp_verified: data.otpVerified,
        otp_verified_at: data.otpVerifiedAt,
        signature_key: data.signatureKey,
        id_photo_key: data.idPhotoKey,
        parcel_photo_key: data.parcelPhotoKey,
        additional_photo_key: data.additionalPhotoKey,
        delivery_lat: data.deliveryLat,
        delivery_lng: data.deliveryLng,
      },
      select: { id: true },
    });
  }
}
