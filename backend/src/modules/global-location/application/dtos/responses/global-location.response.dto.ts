import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import { LocationPointDto } from '../requests/location-point.dto';

export class GlobalLocationResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'New York' })
  name: string;

  @ApiProperty({ enum: LocationType })
  type: LocationType;

  @ApiPropertyOptional({ example: 'uuid' })
  parentId?: string;

  @ApiPropertyOptional({ type: LocationPointDto })
  location?: LocationPointDto;
}
