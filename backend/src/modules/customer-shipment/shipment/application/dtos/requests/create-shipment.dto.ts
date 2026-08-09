import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentResponsibility,
  ParcelType,
  ServiceLevel,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateShipmentParcelDto {
  @ApiPropertyOptional({ description: 'Free-text description of the contents' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: ParcelType, default: ParcelType.PACKAGE })
  @IsEnum(ParcelType)
  @IsOptional()
  parcelType?: ParcelType;

  @ApiPropertyOptional({ enum: ServiceLevel, default: ServiceLevel.STANDARD })
  @IsEnum(ServiceLevel)
  @IsOptional()
  serviceLevel?: ServiceLevel;

  @ApiProperty({ description: 'Actual weight in kilograms', example: 12.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  actualWeightKg: number;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  lengthCm: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  widthCm: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  heightCm: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFragile?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresUprightHandling?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  temperatureSensitive?: boolean;

  @ApiPropertyOptional({
    description:
      'Organization unit this parcel is finally bound for. Defaults to the shipment destination.',
  })
  @IsUUID()
  @IsOptional()
  destinationOrgUnitId?: string;
}

export class CreateShipmentDto {
  @ApiProperty({ description: 'Sending customer profile' })
  @IsUUID()
  @IsNotEmpty()
  senderCustomerProfileId: string;

  @ApiPropertyOptional({
    description: 'Receiving customer profile, when known',
  })
  @IsUUID()
  @IsOptional()
  receiverCustomerProfileId?: string;

  @ApiPropertyOptional({
    description:
      "Sender's national id. Required when the tenant enables requireSenderNationalId.",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(50)
  @IsOptional()
  senderNationalId?: string;

  @ApiPropertyOptional({
    description:
      'Shipment request being converted. When present it is marked converted in the same transaction.',
  })
  @IsUUID()
  @IsOptional()
  shipmentRequestId?: string;

  @ApiPropertyOptional({ description: 'Quotation the customer approved' })
  @IsUUID()
  @IsOptional()
  approvedQuotationId?: string;

  @ApiProperty({ description: 'Organization unit the shipment starts from' })
  @IsUUID()
  @IsNotEmpty()
  originOrgUnitId: string;

  @ApiProperty({ description: 'Organization unit the shipment is bound for' })
  @IsUUID()
  @IsNotEmpty()
  destinationOrgUnitId: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  receiverName: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  receiverPhone: string;

  @ApiPropertyOptional({ enum: ServiceLevel, default: ServiceLevel.STANDARD })
  @IsEnum(ServiceLevel)
  @IsOptional()
  serviceLevel?: ServiceLevel;

  @ApiPropertyOptional({
    enum: PaymentResponsibility,
    default: PaymentResponsibility.SENDER,
  })
  @IsEnum(PaymentResponsibility)
  @IsOptional()
  paymentResponsibility?: PaymentResponsibility;

  @ApiProperty({
    description: 'Parcels making up this shipment. At least one is required.',
    type: [CreateShipmentParcelDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentParcelDto)
  parcels: CreateShipmentParcelDto[];
}
