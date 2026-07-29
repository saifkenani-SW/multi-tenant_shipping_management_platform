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
import { EmployeeSearchField } from '../../enums/employee-search-field.enum';

export class EmployeeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Generic search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to full name.',
    enum: EmployeeSearchField,
  })
  @IsEnum(EmployeeSearchField)
  @IsOptional()
  searchType?: EmployeeSearchField;

  @ApiPropertyOptional({ description: 'Only employees assigned to this unit' })
  @IsUUID()
  @IsOptional()
  organizationUnitId?: string;

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
