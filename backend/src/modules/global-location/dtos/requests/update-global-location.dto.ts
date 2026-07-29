import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * النوع والأب غير قابلين للتعديل: تغييرهما ينقل شجرة كاملة ويبطل
 * تغطية فروع مبنية على هذا الموقع. النقل يحتاج عملية مستقلة.
 */
export class UpdateGlobalLocationDto {
  @ApiPropertyOptional({ description: 'Location name', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

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
