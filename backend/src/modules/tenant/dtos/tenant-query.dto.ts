import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationDto } from '../../../core/dtos/base-pagination.dto';

export enum TenantSearchField {
  NAME = 'name',
  TAX_NUMBER = 'tax_number',
}

export class TenantQueryDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: TenantSearchField,
  })
  @IsEnum(TenantSearchField)
  @IsOptional()
  searchType?: TenantSearchField;
}
