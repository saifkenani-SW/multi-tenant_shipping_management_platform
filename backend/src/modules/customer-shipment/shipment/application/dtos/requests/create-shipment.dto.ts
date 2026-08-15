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
import { normalizeCitizenPhone } from '../../../../../../common/utils/phone.util';

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
}

/**
 * What the customer is charged for this shipment.
 *
 * Pricing is decided on the shipping side — from the approved quotation when
 * the shipment came from a request, or entered by the member of staff for a
 * customer who walks into a branch. Billing records these figures and does not
 * recalculate them.
 */
export class ShipmentBillingDto {
  @ApiProperty({
    description: 'Charge before fees, tax and discount',
    example: 35.0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Handling fees', default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  handlingFees?: number;

  @ApiPropertyOptional({ description: 'Tax applied', default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Discount granted', default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discountAmount?: number;
}

export class CreateShipmentDto {
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

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  senderName: string;

  @ApiProperty({
    maxLength: 50,
    description: 'Sender phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => normalizeCitizenPhone(value))
  senderPhone: string;

  @ApiPropertyOptional({
    description:
      'Shipment request being converted. When present it is marked converted in the same transaction.',
  })
  @IsUUID()
  @IsOptional()
  shipmentRequestId?: string;

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

  @ApiProperty({
    maxLength: 50,
    description: 'Receiver phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '0991234567',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => normalizeCitizenPhone(value))
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
    description:
      'Charges for this shipment. An invoice is raised from these figures in the same transaction.',
    type: ShipmentBillingDto,
  })
  @ValidateNested()
  @Type(() => ShipmentBillingDto)
  billing: ShipmentBillingDto;

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
