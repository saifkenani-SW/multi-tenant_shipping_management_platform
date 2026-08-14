import { ApiProperty } from '@nestjs/swagger';
import { ParcelResponseDto } from './parcel.response.dto';

export class ParcelTrackingResponseDto extends ParcelResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  history: any[];
}
