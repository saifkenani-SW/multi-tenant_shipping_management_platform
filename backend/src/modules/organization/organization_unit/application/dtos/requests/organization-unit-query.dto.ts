import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OrgType } from '../../../domain/enums/org-type.enum';
import { Transform } from 'class-transformer';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

export class OrganizationUnitQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenant ID (required for platform owner)',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by organization type',
    enum: OrgType,
  })
  @IsEnum(OrgType)
  @IsOptional()
  orgType?: OrgType;

  @ApiPropertyOptional({ description: 'Filter by parent organization unit ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Filter by tenant zone ID' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isActive?: boolean;
}
