import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination';
import { TenantSearchField } from '../../enums/tenant-search-field.enum';

export class TenantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Generic search query',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: TenantSearchField,
  })
  @IsEnum(TenantSearchField)
  @IsOptional()
  searchType?: TenantSearchField;
}
