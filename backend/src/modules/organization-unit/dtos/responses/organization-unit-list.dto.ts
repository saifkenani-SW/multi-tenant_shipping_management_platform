import { ApiProperty } from '@nestjs/swagger';

import { OrgType } from '../../enums/org-type.enum';

export class OrganizationUnitListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Unit name', example: 'Amman Main Branch' })
  name: string;

  @ApiProperty({ description: 'Kind of unit', enum: OrgType })
  orgType: OrgType;

  @ApiProperty({ description: 'Parent unit id', nullable: true })
  parentId: string | null;

  @ApiProperty({ description: 'Whether the unit is operational' })
  isActive: boolean;
}

export class PaginatedOrganizationUnitListDto {
  @ApiProperty({
    description: 'List of organization units',
    type: [OrganizationUnitListDto],
  })
  data: OrganizationUnitListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 30 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
