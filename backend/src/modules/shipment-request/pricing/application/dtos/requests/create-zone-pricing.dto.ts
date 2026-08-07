import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ServiceLevel } from '@prisma/client';

export class CreateZonePricingDto {
  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4a' })
  @IsUUID('7')
  originZoneId: string;

  @ApiProperty({ example: '019133bd-a521-7000-9870-b1a9f1a23c4b' })
  @IsUUID('7')
  destinationZoneId: string;

  @ApiProperty({
    enum: ServiceLevel,
    default: ServiceLevel.STANDARD,
    example: ServiceLevel.STANDARD,
  })
  @IsEnum(ServiceLevel)
  serviceLevel: ServiceLevel;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  baseWeightKg: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerExtraKg?: number;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'If true, creates two records: one from Origin -> Destination and another from Destination -> Origin with the exact same price.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;
}
