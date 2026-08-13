import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionMethod, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  otpVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Storage key of the captured signature, not a URL',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  signatureKey?: string;

  @ApiPropertyOptional({ description: 'Storage key of the id photo' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  idPhotoKey?: string;

  @ApiPropertyOptional({ description: 'Storage key of the parcel photo' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  parcelPhotoKey?: string;

  @ApiPropertyOptional({ description: 'Storage key of any extra photo' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  additionalPhotoKey?: string;

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
