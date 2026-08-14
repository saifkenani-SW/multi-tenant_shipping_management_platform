import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionMethod } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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
}
