import { CollectionMethod } from '@prisma/client';

/**
 * Proof of delivery.
 *
 * A pure value holder: once written it is never updated or cancelled, so this
 * class exposes no mutating behaviour at all. Evidence keys are storage keys,
 * never URLs.
 */
export class ProofOfDelivery {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly parcelId: string,
    public readonly deliveredByEmployeeId: string,
    public readonly collectionMethod: CollectionMethod,
    public readonly receivedByName: string,
    public readonly receivedByNationalId: string | null,
    public readonly otpVerified: boolean,
    public readonly otpVerifiedAt: Date | null,
    public readonly signatureKey: string | null,
    public readonly idPhotoKey: string | null,
    public readonly parcelPhotoKey: string | null,
    public readonly additionalPhotoKey: string | null,
    public readonly deliveryLat: number | null,
    public readonly deliveryLng: number | null,
    public readonly createdAt: Date,
  ) {}
}
