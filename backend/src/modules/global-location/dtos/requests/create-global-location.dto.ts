import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { LocationType } from '../../enums/location-type.enum';

export class CreateGlobalLocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Amman',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Level in the hierarchy', enum: LocationType })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiPropertyOptional({
    description: 'Parent location. Required for everything below COUNTRY.',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Longitude (WGS84)', example: 35.9106 })
  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude (WGS84)', example: 31.9539 })
  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;
}
