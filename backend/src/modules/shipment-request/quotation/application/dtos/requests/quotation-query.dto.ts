import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QuotationStatus, ServiceLevel } from '@prisma/client';

export class QuotationQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  originOrgUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  destinationOrgUnitId?: string;

  @ApiPropertyOptional({ enum: ServiceLevel })
  @IsOptional()
  @IsEnum(ServiceLevel)
  serviceLevel?: ServiceLevel;

  @ApiPropertyOptional({ enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}
