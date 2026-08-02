import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { CustomerShipmentEntity } from '../../domain/entities/customer-shipment.entity';
import { CustomerShipmentPersistenceMapper } from '../mappers/customer-shipment.persistence.mapper';
import { PaymentResponsibility, $Enums } from '@prisma/client';

@Injectable()
export class CustomerShipmentCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    shipmentEntity: CustomerShipmentEntity,
  ): Promise<CustomerShipmentEntity> {
    const shipment = await this.prisma.customer_shipment.create({
      data: {
        id: shipmentEntity.id,
        tenant_id: shipmentEntity.tenantId,
        sender_customer_profile_id: shipmentEntity.senderCustomerProfileId,
        receiver_customer_profile_id: shipmentEntity.receiverCustomerProfileId,
        shipment_request_id: shipmentEntity.shipmentRequestId,
        approved_quotation_id: shipmentEntity.approvedQuotationId,
        receiver_name: shipmentEntity.receiverName,
        receiver_phone: shipmentEntity.receiverPhone,
        receiver_address: shipmentEntity.receiverAddress,
        payment_responsibility: shipmentEntity.paymentResponsibility,
        total_chargeable_weight_kg: shipmentEntity.totalChargeableWeightKg,
        status: shipmentEntity.status as $Enums.ShipmentStatus,
        parcel: {
          createMany: {
            data: shipmentEntity.parcels.map((p) => ({
              id: p.id,
              tenant_id: p.tenantId,
              tracking_number: p.trackingNumber,
              actual_weight_kg: p.actualWeightKg,
              length_cm: p.lengthCm,
              width_cm: p.widthCm,
              height_cm: p.heightCm,
              volumetric_weight_kg: p.volumetricWeightKg,
              current_status: p.currentStatus as $Enums.ParcelStatus,
              current_condition: p.currentCondition as $Enums.ParcelCondition,
            })),
          },
        },
      },
      include: {
        parcel: true,
      },
    });

    return CustomerShipmentPersistenceMapper.toDomain(shipment);
  }

  async update(
    id: string,
    data: {
      receiverName?: string;
      receiverPhone?: string;
      receiverAddress?: string;
      paymentResponsibility?: PaymentResponsibility;
    },
  ): Promise<CustomerShipmentEntity> {
    const shipment = await this.prisma.customer_shipment.update({
      where: { id },
      data: {
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        receiver_address: data.receiverAddress,
        payment_responsibility: data.paymentResponsibility,
      },
    });

    return CustomerShipmentPersistenceMapper.toDomain(shipment);
  }
}
