import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrgType } from '../../../domain/enums/org-type.enum';
import { CoverageType } from '@prisma/client';

export class LocationDto {
  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;
}

export class OrgUnitLocationMappingDto {
  @ApiProperty({
    description: 'Global Location ID (Country, City, Region, etc.)',
  })
  @IsUUID()
  @IsNotEmpty()
  globalLocationId: string;

  @ApiPropertyOptional({
    description: 'Coverage type (e.g. DELIVERY_AREA)',
    enum: CoverageType,
    default: CoverageType.DELIVERY_AREA,
  })
  @IsEnum(CoverageType)
  @IsOptional()
  coverageType?: CoverageType;
}

export class CreateOrganizationUnitDto {
  @ApiProperty({ description: 'Name of the organization unit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Type of the organization unit', enum: OrgType })
  @IsEnum(OrgType)
  @IsNotEmpty()
  orgType: OrgType;

  @ApiPropertyOptional({ description: 'Parent organization unit ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Tenant zone ID' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Address line' })
  @IsString()
  @IsOptional()
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Exact geolocation (Point)',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Is the organization unit active?',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Locations this organization unit covers',
    type: [OrgUnitLocationMappingDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgUnitLocationMappingDto)
  @IsOptional()
  coverageLocations?: OrgUnitLocationMappingDto[];
}
