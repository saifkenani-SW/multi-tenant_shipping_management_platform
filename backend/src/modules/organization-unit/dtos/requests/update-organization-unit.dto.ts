import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * النوع والأب غير قابلين للتعديل: تغيير الأب ينقل شجرة كاملة ويستوجب
 * إعادة حساب tree_path لكل الأحفاد. النقل عملية مستقلة لا تعديل حقل.
 */
export class UpdateOrganizationUnitDto {
  @ApiPropertyOptional({ description: 'Unit name', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Pricing zone this unit belongs to' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Street address', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressLine?: string;

  @ApiPropertyOptional({ description: 'Deactivating stops routing to the unit' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Longitude (WGS84)' })
  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude (WGS84)' })
  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;
}
