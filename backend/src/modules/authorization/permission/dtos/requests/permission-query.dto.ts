import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../../../common/pagination';
import { PermissionSearchField } from '../../enums/permission-search-field.enum';

export class PermissionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Generic search query',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: PermissionSearchField,
  })
  @IsEnum(PermissionSearchField)
  @IsOptional()
  searchType?: PermissionSearchField;

  @ApiPropertyOptional({
    description: 'Filter by the resource the permission belongs to',
    example: 'parcel',
  })
  @IsString()
  @IsOptional()
  resource?: string;
}
