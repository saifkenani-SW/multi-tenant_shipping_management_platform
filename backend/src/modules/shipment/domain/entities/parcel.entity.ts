import { ParcelStatus } from '../enums/parcel-status.enum';
import { ParcelCondition } from '../enums/parcel-condition.enum';

export class Parcel {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerShipmentId: string,
    public readonly trackingNumber: string,
    public readonly actualWeightKg: number,
    public readonly lengthCm: number,
    public readonly widthCm: number,
    public readonly heightCm: number,
    public readonly currentStatus: ParcelStatus,
    public readonly currentCondition: ParcelCondition,
    public readonly currentOrgUnitId: string | null,
    public readonly volumetricWeightKg: number | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    tenantId: string,
    customerShipmentId: string,
    trackingNumber: string,
    actualWeightKg: number,
    lengthCm: number,
    widthCm: number,
    heightCm: number,
    condition: ParcelCondition,
    volumetricDivisor: number,
  ): Parcel {
    const volumetricWeightKg = Number(
      ((lengthCm * widthCm * heightCm) / volumetricDivisor).toFixed(2),
    );

    return new Parcel(
      id,
      tenantId,
      customerShipmentId,
      trackingNumber,
      actualWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      ParcelStatus.PROCESSING,
      condition,
      null, // currentOrgUnitId initially null
      volumetricWeightKg,
      new Date(),
      new Date(),
    );
  }
}
