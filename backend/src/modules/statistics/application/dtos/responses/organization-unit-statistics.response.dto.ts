import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '../../../../organization/organization_unit/domain/enums/org-type.enum';

/**
 * Whose unit dashboard this is. Same idea as the financial dashboard: one
 * response shape, and this field tells the frontend how to read it.
 */
export enum OrgUnitStatsScope {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export class OrgUnitTypeBucketDto {
  @ApiProperty({ enum: OrgType })
  type: OrgType;

  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;
}

/**
 * Counts taken from every table that points at an organization unit.
 * Origin and destination are kept apart: a unit that sent a shipment is
 * not the same fact as a unit that is waiting to receive one.
 */
export class OrgUnitRelatedCountsDto {
  @ApiProperty({ description: 'Active employee assignments on the unit' })
  employees: number;

  @ApiProperty({ description: 'Parcels whose current location is this unit' })
  parcelsCurrent: number;

  @ApiProperty({
    description: 'Parcels destined here that have not arrived yet',
  })
  parcelsIncoming: number;

  @ApiProperty()
  shipmentsOrigin: number;

  @ApiProperty()
  shipmentsDestination: number;

  @ApiProperty()
  tripsOrigin: number;

  @ApiProperty()
  tripsDestination: number;

  @ApiProperty()
  manifestsOrigin: number;

  @ApiProperty()
  manifestsDestination: number;

  @ApiProperty()
  invoicesOrigin: number;

  @ApiProperty()
  invoicesDestination: number;

  @ApiProperty()
  quotationsOrigin: number;

  @ApiProperty()
  quotationsDestination: number;

  @ApiProperty({ description: 'Mapped coverage locations' })
  coverageLocations: number;
}

export class OrgUnitStatsRowDto extends OrgUnitRelatedCountsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: OrgType })
  type: OrgType;

  @ApiProperty()
  isActive: boolean;
}

export class CompanyOrgUnitStatsDto extends OrgUnitRelatedCountsDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty({ nullable: true })
  tenantName: string | null;

  @ApiProperty()
  units: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty({ type: [OrgUnitTypeBucketDto] })
  byType: OrgUnitTypeBucketDto[];

  @ApiPropertyOptional({
    type: [OrgUnitStatsRowDto],
    description:
      'Per-unit rows. Present when the caller is looking at one company.',
  })
  branches?: OrgUnitStatsRowDto[];
}

export class OrganizationUnitStatisticsTotalsDto extends OrgUnitRelatedCountsDto {
  @ApiProperty()
  units: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty({ type: [OrgUnitTypeBucketDto] })
  byType: OrgUnitTypeBucketDto[];
}

export class OrganizationUnitStatisticsResponseDto {
  @ApiProperty({
    enum: OrgUnitStatsScope,
    description:
      'Whose dashboard this is. A platform owner sees every company, a tenant admin their own, an employee their assigned units.',
  })
  scope: OrgUnitStatsScope;

  @ApiProperty({ type: OrganizationUnitStatisticsTotalsDto })
  totals: OrganizationUnitStatisticsTotalsDto;

  @ApiProperty({
    type: [CompanyOrgUnitStatsDto],
    description: 'One entry per company. Never mixed across companies.',
  })
  companies: CompanyOrgUnitStatsDto[];
}
