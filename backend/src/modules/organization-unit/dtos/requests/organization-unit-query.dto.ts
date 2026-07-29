import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../../common/pagination';
import { OrgType } from '../../enums/org-type.enum';
import { OrganizationUnitSearchField } from '../../enums/organization-unit-search-field.enum';

export class OrganizationUnitQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Generic search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: OrganizationUnitSearchField,
  })
  @IsEnum(OrganizationUnitSearchField)
  @IsOptional()
  searchType?: OrganizationUnitSearchField;

  @ApiPropertyOptional({ description: 'Filter by kind of unit', enum: OrgType })
  @IsEnum(OrgType)
  @IsOptional()
  orgType?: OrgType;

  @ApiPropertyOptional({ description: 'Filter by pricing zone' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Only direct children of this unit' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Only top-level units. Ignored when parentId is given.',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  rootsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active state' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
