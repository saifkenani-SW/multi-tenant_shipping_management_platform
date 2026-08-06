import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZoneOrganizationUnitDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class TenantZoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: [ZoneOrganizationUnitDto] })
  organizationUnits?: ZoneOrganizationUnitDto[];
}
