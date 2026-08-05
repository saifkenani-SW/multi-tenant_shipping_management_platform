import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNumber } from 'class-validator';

export class LocationPointDto {
  @ApiProperty({ example: 40.7128, description: 'Latitude coordinate' })
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -74.006, description: 'Longitude coordinate' })
  @IsNumber()
  @IsLongitude()
  longitude: number;
}
