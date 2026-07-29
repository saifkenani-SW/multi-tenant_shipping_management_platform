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
import { GlobalLocationSearchField } from '../../enums/global-location-search-field.enum';
import { LocationType } from '../../enums/location-type.enum';

export class GlobalLocationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Generic search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: GlobalLocationSearchField,
  })
  @IsEnum(GlobalLocationSearchField)
  @IsOptional()
  searchType?: GlobalLocationSearchField;

  @ApiPropertyOptional({
    description: 'Filter by hierarchy level',
    enum: LocationType,
  })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @ApiPropertyOptional({ description: 'Only direct children of this location' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Only top-level locations. Ignored when parentId is given.',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  rootsOnly?: boolean;
}
