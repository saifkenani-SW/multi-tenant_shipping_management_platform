import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddManifestItemDto {
  @ApiProperty({
    description: 'Parcel to load on this manifest',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  parcelId: string;
}
