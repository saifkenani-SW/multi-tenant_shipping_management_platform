import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddManifestItemsDto {
  @ApiProperty({
    description: 'Parcels to load on this manifest',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  parcelIds: string[];
}
