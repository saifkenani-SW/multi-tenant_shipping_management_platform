import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationCandidateDto {
  @ApiProperty()
  tenantId: string;

  @ApiPropertyOptional()
  tenantName?: string;

  @ApiProperty()
  orgUnitId: string;

  @ApiProperty()
  orgUnitName: string;

  @ApiPropertyOptional()
  zoneId?: string;

  @ApiPropertyOptional()
  zoneName?: string;
}

export class RouteCandidateDto {
  @ApiProperty()
  orgUnitId: string;

  @ApiProperty()
  orgUnitName: string;

  @ApiPropertyOptional()
  zoneId?: string;

  @ApiPropertyOptional()
  zoneName?: string;
}

export class ResolvedTenantCandidatesDto {
  @ApiProperty()
  tenantId: string;

  @ApiPropertyOptional()
  tenantName?: string;

  @ApiProperty({ type: [RouteCandidateDto] })
  originCandidates: RouteCandidateDto[];

  @ApiProperty({ type: [RouteCandidateDto] })
  destinationCandidates: RouteCandidateDto[];
}
