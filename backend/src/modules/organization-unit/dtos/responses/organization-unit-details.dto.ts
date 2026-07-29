import { ApiProperty } from '@nestjs/swagger';

import { OrgType } from '../../enums/org-type.enum';
import { OrganizationUnitListDto } from './organization-unit-list.dto';

export class OrganizationUnitDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Unit name' })
  name: string;

  @ApiProperty({ description: 'Kind of unit', enum: OrgType })
  orgType: OrgType;

  @ApiProperty({ description: 'Parent unit id', nullable: true })
  parentId: string | null;

  @ApiProperty({ description: 'Pricing zone id', nullable: true })
  zoneId: string | null;

  @ApiProperty({ description: 'Street address', nullable: true })
  addressLine: string | null;

  @ApiProperty({ description: 'Whether the unit is operational' })
  isActive: boolean;

  @ApiProperty({ description: 'Longitude (WGS84)', nullable: true })
  longitude: number | null;

  @ApiProperty({ description: 'Latitude (WGS84)', nullable: true })
  latitude: number | null;

  @ApiProperty({
    description: 'Global location ids this unit covers',
    type: [String],
  })
  coverageLocationIds: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Chain from the root down to the direct parent',
    type: [OrganizationUnitListDto],
  })
  ancestors: OrganizationUnitListDto[];
}
