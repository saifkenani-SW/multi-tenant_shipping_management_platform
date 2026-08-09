import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionMethod } from '@prisma/client';
import { Type } from 'class-transformer';
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
}
