import { Injectable } from '@nestjs/common';
import { ParcelResponseDto } from '../dtos/responses/parcel.response.dto';

/** Maps raw Kysely rows (snake_case) to the API shape (camelCase). */
@Injectable()
export class ParcelMapper {
  toResponse(record: any): ParcelResponseDto {
    return {
      id: record.id,
      tenantId: record.tenant_id,
      customerShipmentId: record.customer_shipment_id,
      trackingNumber: record.tracking_number,
      description: record.description ?? null,
      category: record.category ?? null,
      parcelType: record.parcel_type,
      serviceLevel: record.service_level,
      actualWeightKg: Number(record.actual_weight_kg),
      lengthCm: Number(record.length_cm),
      widthCm: Number(record.width_cm),
      heightCm: Number(record.height_cm),
      volumetricWeightKg:
        record.volumetric_weight_kg === null ||
        record.volumetric_weight_kg === undefined
          ? null
          : Number(record.volumetric_weight_kg),
      isFragile: record.is_fragile,
      requiresUprightHandling: record.requires_upright_handling,
      temperatureSensitive: record.temperature_sensitive,
      currentStatus: record.current_status,
      currentCondition: record.current_condition,
      currentOrgUnitId: record.current_org_unit_id ?? null,
      destinationOrgUnitId: record.destination_org_unit_id ?? null,
      labelKey: record.label_key ?? null,
      version: record.version,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
