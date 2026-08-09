import { ApiProperty } from '@nestjs/swagger';

export class ShipmentRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerProfileId: string;

  @ApiProperty()
  targetTenantId?: string;

  @ApiProperty()
  originGlobalLocationId: string;

  @ApiProperty()
  originGlobalLocationName: string;

  @ApiProperty()
  destinationGlobalLocationId: string;

  @ApiProperty()
  destinationGlobalLocationName: string;

  @ApiProperty()
  senderName: string;

  @ApiProperty()
  senderPhone: string;

  @ApiProperty()
  receiverName: string;

  @ApiProperty()
  receiverPhone: string;

  @ApiProperty()
  expectedPiecesCount: number;

  @ApiProperty()
  expectedTotalWeightKg: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  approvedQuotationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
