import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({ nullable: true })
  basePrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  weightCharge: number | null;

  @ApiPropertyOptional({ nullable: true })
  extraFees: number | null;

  @ApiPropertyOptional({ nullable: true })
  amount: number | null;

  @ApiProperty()
  pricingSnapshot: any;

  @ApiProperty()
  status: QuotationStatus;

  @ApiProperty()
  createdAt: Date;
}
