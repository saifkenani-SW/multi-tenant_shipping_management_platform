import { customer_shipment, parcel } from '@prisma/client';
import { CustomerShipmentEntity } from '../../domain/entities/customer-shipment.entity';
import { Parcel } from '../../domain/entities/parcel.entity';
import { PaymentResponsibility } from '../../domain/enums/payment-responsibility.enum';
import { ShipmentStatus } from '../../domain/enums/shipment-status.enum';
import { ParcelStatus } from '../../domain/enums/parcel-status.enum';
import { ParcelCondition } from '../../domain/enums/parcel-condition.enum';

export class CustomerShipmentPersistenceMapper {
  static toDomain(prismaShipment: customer_shipment & { parcel?: parcel[] }): CustomerShipmentEntity {
    return new CustomerShipmentEntity({
      id: prismaShipment.id,
      tenantId: prismaShipment.tenant_id,
      senderCustomerProfileId: prismaShipment.sender_customer_profile_id,
      receiverCustomerProfileId: prismaShipment.receiver_customer_profile_id ?? undefined,
      shipmentRequestId: prismaShipment.shipment_request_id,
      approvedQuotationId: prismaShipment.approved_quotation_id,
      receiverName: prismaShipment.receiver_name,
      receiverPhone: prismaShipment.receiver_phone,
      receiverAddress: prismaShipment.receiver_address,
      paymentResponsibility: prismaShipment.payment_responsibility as PaymentResponsibility,
      totalChargeableWeightKg: prismaShipment.total_chargeable_weight_kg
        ? Number(prismaShipment.total_chargeable_weight_kg)
        : 0,
      status: prismaShipment.status as ShipmentStatus,
      createdAt: prismaShipment.created_at,
      updatedAt: prismaShipment.updated_at,
      parcels: prismaShipment.parcel
        ? prismaShipment.parcel.map(
            (p) =>
              new Parcel(
                p.id,
                p.tenant_id,
                p.customer_shipment_id,
                p.tracking_number,
                Number(p.actual_weight_kg),
                Number(p.length_cm),
                Number(p.width_cm),
                Number(p.height_cm),
                p.current_status as ParcelStatus,
                p.current_condition as ParcelCondition,
                p.current_org_unit_id,
                p.volumetric_weight_kg ? Number(p.volumetric_weight_kg) : null,
                p.created_at,
                p.updated_at,
              ),
          )
        : [],
    });
  }
}
