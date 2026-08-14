import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelCondition, ParcelStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

export class ParcelQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: ParcelStatus, isArray: true, type: [String], description: 'Comma separated list of statuses' })
  @IsEnum(ParcelStatus, { each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: ParcelStatus[];

  @ApiPropertyOptional({ enum: ParcelCondition })
  @IsEnum(ParcelCondition)
  @IsOptional()
  condition?: ParcelCondition;

  @ApiPropertyOptional({ description: 'Filter by current organization unit' })
  @IsUUID()
  @IsOptional()
  currentOrgUnitId?: string;

  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
