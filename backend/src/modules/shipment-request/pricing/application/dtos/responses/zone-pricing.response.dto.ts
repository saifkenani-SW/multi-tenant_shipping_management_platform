import { ApiProperty } from '@nestjs/swagger';
import { ServiceLevel } from '@prisma/client';

export class ZonePricingResponseDto {
  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4d' })
  id: string;

  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4c' })
  tenantId: string;

  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4a' })
  originZoneId: string;

  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4b' })
  destinationZoneId: string;

  @ApiProperty({ enum: ServiceLevel, example: ServiceLevel.STANDARD })
  serviceLevel: ServiceLevel;

  @ApiProperty({ example: 25.5 })
  basePrice: number;

  @ApiProperty({ example: 5 })
  baseWeightKg: number;

  @ApiProperty({ example: 3 })
  pricePerExtraKg: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-08-07T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-08-07T12:00:00.000Z' })
  updatedAt: Date;
}
