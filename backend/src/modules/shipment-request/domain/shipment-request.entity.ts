import { RequestStatus } from '@prisma/client';

/**
 * ShipmentRequest Domain Entity.
 * Represents the business concept of a customer's shipment request,
 * from initial submission through quotation approval to conversion.
 */
export class ShipmentRequest {
  constructor(
    public readonly id: string,
    public readonly customerProfileId: string,
    public readonly targetTenantId: string | null,
    public readonly senderName: string,
    public readonly senderPhone: string,
    public readonly senderAddress: string,
    public readonly receiverName: string,
    public readonly receiverPhone: string,
    public readonly receiverAddress: string,
    public readonly expectedPiecesCount: number,
    public readonly expectedTotalWeightKg: number | null,
    public readonly notes: string | null,
    public readonly status: RequestStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly cancelledAt: Date | null = null,
    public readonly cancellationReason: string | null = null,
    public readonly originOrgUnitId: string | null = null,
    public readonly destinationOrgUnitId: string | null = null,
  ) {}
}
