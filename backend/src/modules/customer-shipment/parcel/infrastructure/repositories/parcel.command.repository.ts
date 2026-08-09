import { ConflictException, Injectable } from '@nestjs/common';
import {
  ParcelCondition,
  ParcelStatus,
  ParcelType,
  ServiceLevel,
} from '@prisma/client';
import { TransactionalPrismaService } from '../../../../../packages/transaction';

export interface CreateParcelData {
  tenantId: string;
  customerShipmentId: string;
  trackingNumber: string;
  description: string | null;
  category: string | null;
  parcelType: ParcelType;
  serviceLevel: ServiceLevel;
  isFragile: boolean;
  requiresUprightHandling: boolean;
  temperatureSensitive: boolean;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  destinationOrgUnitId: string | null;
  currentOrgUnitId: string | null;
  labelKey: string | null;
}

@Injectable()
export class ParcelCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateParcelData): Promise<{ id: string }> {
    return this.prisma.client.parcel.create({
      data: {
        tenant_id: data.tenantId,
        customer_shipment_id: data.customerShipmentId,
        tracking_number: data.trackingNumber,
        description: data.description,
        category: data.category,
        parcel_type: data.parcelType,
        service_level: data.serviceLevel,
        is_fragile: data.isFragile,
        requires_upright_handling: data.requiresUprightHandling,
        temperature_sensitive: data.temperatureSensitive,
        actual_weight_kg: data.actualWeightKg,
        length_cm: data.lengthCm,
        width_cm: data.widthCm,
        height_cm: data.heightCm,
        volumetric_weight_kg: data.volumetricWeightKg,
        destination_org_unit_id: data.destinationOrgUnitId,
        current_org_unit_id: data.currentOrgUnitId,
        label_key: data.labelKey,
      },
      select: { id: true },
    });
  }

  /**
   * Writes a transition already approved by the aggregate, guarded by the
   * version it was loaded with. A concurrent write bumps that version, the
   * WHERE stops matching, and the caller is told to retry instead of silently
   * overwriting the other change.
   */
  async updateStatus(
    parcelId: string,
    newStatus: ParcelStatus,
    currentVersion: number,
    extra?: {
      condition?: ParcelCondition;
      currentOrgUnitId?: string | null;
    },
  ): Promise<void> {
    const result = await this.prisma.client.parcel.updateMany({
      where: { id: parcelId, version: currentVersion },
      data: {
        current_status: newStatus,
        version: { increment: 1 },
        ...(extra?.condition ? { current_condition: extra.condition } : {}),
        ...(extra?.currentOrgUnitId !== undefined
          ? { current_org_unit_id: extra.currentOrgUnitId }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Parcel was modified by another process. Please retry.',
      );
    }
  }

  async updateLabelKey(parcelId: string, labelKey: string): Promise<void> {
    await this.prisma.client.parcel.update({
      where: { id: parcelId },
      data: { label_key: labelKey },
    });
  }
}
