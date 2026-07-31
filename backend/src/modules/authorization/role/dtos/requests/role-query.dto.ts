import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../../../common/pagination';
import { RoleSearchField } from '../../enums/role-search-field.enum';

export class RoleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Generic search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: RoleSearchField,
  })
  @IsEnum(RoleSearchField)
  @IsOptional()
  searchType?: RoleSearchField;

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
