import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description:
      'Start of the period, inclusive. Defaults to the first day of the current month.',
    example: '2026-08-01',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @ApiPropertyOptional({
    description: 'End of the period, inclusive. Defaults to now.',
    example: '2026-08-16',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;

  @ApiPropertyOptional({
    description:
      'Platform owner only. Narrows to a single workspace; a tenant admin passing another workspace is refused.',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
