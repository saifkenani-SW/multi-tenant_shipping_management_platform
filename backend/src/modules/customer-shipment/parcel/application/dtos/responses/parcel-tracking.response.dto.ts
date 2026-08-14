import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelResponseDto } from './parcel.response.dto';
import type { ParcelCapabilities } from '../../capabilities/parcel.capabilities.interface';

export class ParcelTrackingResponseDto extends ParcelResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  history: any[];

  @ApiPropertyOptional()
  capabilities?: ParcelCapabilities;
}
