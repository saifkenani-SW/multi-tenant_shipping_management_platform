import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelCondition, ParcelStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

export class ParcelQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: ParcelStatus })
  @IsEnum(ParcelStatus)
  @IsOptional()
  status?: ParcelStatus;

  @ApiPropertyOptional({ enum: ParcelCondition })
  @IsEnum(ParcelCondition)
  @IsOptional()
  condition?: ParcelCondition;

  @ApiPropertyOptional({ description: 'Filter by current organization unit' })
  @IsUUID()
  @IsOptional()
  currentOrgUnitId?: string;
}
