import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionMethod, PaymentMethod } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  Min,
  ValidateNested,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Money taken as the parcel is handed over.
 *
 * Optional: it is only present when this handover is also the moment of
 * payment, which is the case when the receiver is the paying party. A shipment
 * paid by the sender at the origin branch is handed over with nothing to
 * collect.
 */
export class CollectPaymentDto {
  @ApiProperty({ description: 'Amount collected', example: 40.25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Gateway or receipt reference' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  transactionReference?: string;
}

export class RecordDeliveryDto {
  @ApiProperty({ description: 'Name of the person who received the parcel' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  receivedByName: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  receivedByNationalId?: string;

  @ApiPropertyOptional({
    enum: CollectionMethod,
    default: CollectionMethod.CUSTOMER,
  })
  @IsEnum(CollectionMethod)
  @IsOptional()
  collectionMethod?: CollectionMethod;

  @ApiPropertyOptional({
    description: 'Whether OTP was verified (send as string "true" or "false" in form-data)',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  otpVerified?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Captured signature image file',
  })
  signature?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'ID photo image file',
  })
  idPhoto?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Parcel photo image file',
  })
  parcelPhoto?: any;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Up to 3 additional photos (optional)',
  })
  additionalPhoto?: any[];

  @ApiPropertyOptional({ description: 'Latitude where delivery happened' })
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  @IsOptional()
  deliveryLat?: number;

  @ApiPropertyOptional({ description: 'Longitude where delivery happened' })
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  @IsOptional()
  deliveryLng?: number;

  @ApiPropertyOptional({
    description:
      'Payment taken at this handover, when the receiver is the paying party. Recorded against the shipment invoice.',
    type: CollectPaymentDto,
  })
  @ValidateNested()
  @Type(() => CollectPaymentDto)
  @IsOptional()
  payment?: CollectPaymentDto;
}
