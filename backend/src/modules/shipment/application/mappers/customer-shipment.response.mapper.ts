import { CustomerShipmentEntity } from '../../domain/entities/customer-shipment.entity';
import { CustomerShipmentDetailsDto } from '../dtos/responses/customer-shipment-details.dto';
import { ParcelDetailsDto } from '../dtos/responses/parcel-details.dto';

export class CustomerShipmentResponseMapper {
  static toDetailsDto(
    entity: CustomerShipmentEntity,
  ): CustomerShipmentDetailsDto {
    const dto = new CustomerShipmentDetailsDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.senderCustomerProfileId = entity.senderCustomerProfileId;
    dto.receiverCustomerProfileId = entity.receiverCustomerProfileId;
    dto.shipmentRequestId = entity.shipmentRequestId ?? undefined;
    dto.approvedQuotationId = entity.approvedQuotationId ?? undefined;
    dto.receiverName = entity.receiverName;
    dto.receiverPhone = entity.receiverPhone;
    dto.receiverAddress = entity.receiverAddress;
    dto.paymentResponsibility = entity.paymentResponsibility;
    dto.totalChargeableWeightKg = entity.totalChargeableWeightKg;
    dto.status = entity.status;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    dto.parcels = entity.parcels.map((p) => {
      const pDto = new ParcelDetailsDto();
      pDto.id = p.id;
      pDto.trackingNumber = p.trackingNumber;
      pDto.actualWeightKg = p.actualWeightKg;
      pDto.lengthCm = p.lengthCm;
      pDto.widthCm = p.widthCm;
      pDto.heightCm = p.heightCm;
      pDto.volumetricWeightKg = p.volumetricWeightKg;
      pDto.status = p.currentStatus;
      pDto.condition = p.currentCondition;
      pDto.currentOrgUnitId = p.currentOrgUnitId;
      pDto.createdAt = p.createdAt;
      pDto.updatedAt = p.updatedAt;
      return pDto;
    });

    return dto;
  }
}
