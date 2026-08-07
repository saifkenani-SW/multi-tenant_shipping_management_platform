import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { ServiceLevel } from '@prisma/client';

export class ZonePricingQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenant ID (required for platform owner)',
    example: '019133bd-a521-7000-9870-b1a9f1a23c4c',
  })
  @IsUUID('7')
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: '019133bd-a521-7000-9870-b1a9f1a23c4a' })
  @IsOptional()
  @IsUUID('7')
  originZoneId?: string;

  @ApiPropertyOptional({ example: '019133bd-a521-7000-9870-b1a9f1a23c4b' })
  @IsOptional()
  @IsUUID('7')
  destinationZoneId?: string;

  @ApiPropertyOptional({ enum: ServiceLevel, example: ServiceLevel.STANDARD })
  @IsOptional()
  @IsEnum(ServiceLevel)
  serviceLevel?: ServiceLevel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
