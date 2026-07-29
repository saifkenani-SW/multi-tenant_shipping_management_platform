import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { OrgType } from '../../enums/org-type.enum';

export class CreateOrganizationUnitDto {
  @ApiProperty({ description: 'Unit name', example: 'Amman Main Branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Kind of unit', enum: OrgType })
  @IsEnum(OrgType)
  orgType: OrgType;

  @ApiPropertyOptional({
    description: 'Parent unit. Must belong to the same tenant.',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Pricing zone this unit belongs to' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Street address', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressLine?: string;

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

  @ApiPropertyOptional({
    description: 'Global location ids this unit covers',
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  coverageLocationIds?: string[];
}
