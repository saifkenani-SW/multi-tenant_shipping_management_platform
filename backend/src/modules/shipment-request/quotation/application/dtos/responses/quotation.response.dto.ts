import { ApiProperty } from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';

export class QuotationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  tenantName: string;

  @ApiProperty()
  shipmentRequestId: string;

  @ApiProperty()
  originOrgUnitId: string;

  @ApiProperty()
  originOrgUnitName: string;

  @ApiProperty()
  destinationOrgUnitId: string;

  @ApiProperty()
  destinationOrgUnitName: string;

  @ApiProperty()
  serviceLevel: string;

  @ApiProperty()
  quotationType: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  weightCharge: number;

  @ApiProperty()
  extraFees: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  pricingSnapshot: any;

  @ApiProperty()
  status: QuotationStatus;

  @ApiProperty()
  createdAt: Date;
}
