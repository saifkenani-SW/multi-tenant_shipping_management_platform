import { ApiProperty } from '@nestjs/swagger';

import { LocationType } from '../../enums/location-type.enum';
import { GlobalLocationListDto } from './global-location-list.dto';

export class GlobalLocationDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Location name', example: 'Amman' })
  name: string;

  @ApiProperty({ description: 'Level in the hierarchy', enum: LocationType })
  type: LocationType;

  @ApiProperty({ description: 'Parent location id', nullable: true })
  parentId: string | null;

  @ApiProperty({
    description: 'Longitude (WGS84)',
    example: 35.9106,
    nullable: true,
  })
  longitude: number | null;

  @ApiProperty({
    description: 'Latitude (WGS84)',
    example: 31.9539,
    nullable: true,
  })
  latitude: number | null;

  @ApiProperty({
    description: 'Chain from the root down to the direct parent',
    type: [GlobalLocationListDto],
  })
  ancestors: GlobalLocationListDto[];
}
