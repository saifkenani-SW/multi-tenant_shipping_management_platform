import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelCondition, ParcelStatus } from '@prisma/client';

export class ParcelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  customerShipmentId: string;

  @ApiProperty()
  trackingNumber: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  category?: string | null;

  @ApiProperty()
  parcelType: string;

  @ApiProperty()
  serviceLevel: string;

  @ApiProperty()
  actualWeightKg: number;

  @ApiProperty()
  lengthCm: number;

  @ApiProperty()
  widthCm: number;

  @ApiProperty()
  heightCm: number;

  @ApiPropertyOptional({ nullable: true })
  volumetricWeightKg?: number | null;

  @ApiProperty()
  isFragile: boolean;

  @ApiProperty()
  requiresUprightHandling: boolean;

  @ApiProperty()
  temperatureSensitive: boolean;

  @ApiProperty({ enum: ParcelStatus })
  currentStatus: ParcelStatus;

  @ApiProperty({ enum: ParcelCondition })
  currentCondition: ParcelCondition;

  @ApiPropertyOptional({ nullable: true })
  currentOrgUnitId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  destinationOrgUnitId?: string | null;

  @ApiPropertyOptional({
    description:
      'Storage key of the generated label. Resolve to a URL through the storage provider.',
    nullable: true,
  })
  labelKey?: string | null;

  @ApiProperty({ description: 'Optimistic locking version' })
  version: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
