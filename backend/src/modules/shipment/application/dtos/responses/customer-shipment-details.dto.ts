import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentResponsibility } from '../../../domain/enums/payment-responsibility.enum';
import { ShipmentStatus } from '../../../domain/enums/shipment-status.enum';
import { ParcelDetailsDto } from './parcel-details.dto';

export class CustomerShipmentDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty({ description: 'The UUID of the sender customer profile' })
  senderCustomerProfileId: string;

  @ApiPropertyOptional({
    description: 'The UUID of the receiver customer profile, if registered',
  })
  receiverCustomerProfileId?: string;

  @ApiPropertyOptional()
  shipmentRequestId?: string;

  @ApiPropertyOptional()
  approvedQuotationId?: string;

  @ApiProperty()
  receiverName: string;

  @ApiProperty()
  receiverPhone: string;

  @ApiProperty()
  receiverAddress: string;

  @ApiProperty({ enum: PaymentResponsibility })
  paymentResponsibility: PaymentResponsibility;

  @ApiProperty()
  totalChargeableWeightKg: number;

  @ApiProperty({ enum: ShipmentStatus })
  status: ShipmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ParcelDetailsDto] })
  parcels: ParcelDetailsDto[];
}
