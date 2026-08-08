import { ApiProperty } from '@nestjs/swagger';
import { ManifestItemStatus } from '../../../domain/enums/manifest-item-status.enum';

export class ManifestItemDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning manifest identifier' })
  manifestId: string;

  @ApiProperty({ description: 'Parcel carried on this manifest' })
  parcelId: string;

  @ApiProperty({ enum: ManifestItemStatus })
  status: ManifestItemStatus;

  @ApiProperty({ description: 'When the parcel was loaded', nullable: true })
  loadedAt: Date | null;

  @ApiProperty({ description: 'When the parcel was unloaded', nullable: true })
  unloadedAt: Date | null;
}
