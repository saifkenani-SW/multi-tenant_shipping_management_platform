import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class OrganizationUnitStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Platform owner only. Narrows to a single company; a tenant admin passing another company is refused.',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
