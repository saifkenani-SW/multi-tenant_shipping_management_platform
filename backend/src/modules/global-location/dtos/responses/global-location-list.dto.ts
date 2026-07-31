import { ApiProperty } from '@nestjs/swagger';

import { LocationType } from '../../enums/location-type.enum';

export class GlobalLocationListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Location name', example: 'Amman' })
  name: string;

  @ApiProperty({ description: 'Level in the hierarchy', enum: LocationType })
  type: LocationType;

  @ApiProperty({ description: 'Parent location id', nullable: true })
  parentId: string | null;
}

export class PaginatedGlobalLocationListDto {
  @ApiProperty({
    description: 'List of locations',
    type: [GlobalLocationListDto],
  })
  data: GlobalLocationListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 120 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
