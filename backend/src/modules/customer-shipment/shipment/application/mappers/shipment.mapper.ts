import { Injectable } from '@nestjs/common';
import { ShipmentResponseDto } from '../dtos/responses/shipment.response.dto';
import { ShipmentDetailsResponseDto } from '../dtos/responses/shipment-details.response.dto';
import { ParcelResponseDto } from '../../../parcel/application/dtos/responses/parcel.response.dto';

/** Maps raw Kysely rows (snake_case) to the API shape (camelCase). */
@Injectable()
export class ShipmentMapper {
  toResponse(record: any): ShipmentResponseDto {
    return {
      id: record.id,
      tenantId: record.tenant_id,
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      serviceLevel: record.service_level,
      paymentResponsibility: record.payment_responsibility,
      totalChargeableWeightKg:
        record.total_chargeable_weight_kg === null ||
        record.total_chargeable_weight_kg === undefined
          ? null
          : Number(record.total_chargeable_weight_kg),
      status: record.status,
      createdByEmployeeId: record.created_by_employee_id || null,
      createdByEmployeeName: record.created_by_employee_name || null,
      parcelCount: Number(record.parcel_count || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  toDetails(
    record: any,
    parcels: ParcelResponseDto[],
  ): ShipmentDetailsResponseDto {
    return {
      ...this.toResponse(record),
      senderNationalId: record.sender_national_id || null,
      shipmentRequestId: record.shipment_request_id || null,
      parcels,
    };
  }
}
