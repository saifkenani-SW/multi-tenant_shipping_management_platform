import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';

export class ShipmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  senderCustomerProfileId: string;

  @ApiPropertyOptional()
  receiverCustomerProfileId?: string;

  @ApiProperty()
  originOrgUnitId: string;

  @ApiProperty()
  destinationOrgUnitId: string;

  @ApiProperty()
  receiverName: string;

  @ApiProperty()
  receiverPhone: string;

  @ApiProperty()
  serviceLevel: string;

  @ApiProperty()
  paymentResponsibility: string;

  @ApiPropertyOptional({ nullable: true })
  totalChargeableWeightKg?: number | null;

  @ApiProperty({ enum: ShipmentStatus })
  status: ShipmentStatus;

  @ApiProperty({ description: 'Number of parcels in this shipment' })
  parcelCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
