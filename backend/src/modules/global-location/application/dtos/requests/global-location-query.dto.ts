import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LocationType } from '@prisma/client';
import { CursorPaginationQueryDto } from '../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

export class GlobalLocationQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by location name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LocationType, description: 'Filter by location type' })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiPropertyOptional({ description: 'Filter by parent location ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
