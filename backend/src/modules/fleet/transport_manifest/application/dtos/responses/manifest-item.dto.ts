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

  /**
   * Parcel details, copied in so a client holding this list can name each
   * row. All nullable: a parcel the caller may not read, or one deleted since
   * the manifest was built, leaves the row visible with its status intact
   * instead of failing the whole response.
   */
  @ApiProperty({
    description: 'Tracking number printed on the parcel label',
    nullable: true,
  })
  trackingNumber: string | null;

  @ApiProperty({ description: 'What the parcel contains', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Actual weight in kilograms', nullable: true })
  actualWeightKg: number | null;

  @ApiProperty({ description: 'Needs careful handling', nullable: true })
  isFragile: boolean | null;

  @ApiProperty({
    description: 'Organization unit this parcel is bound for',
    nullable: true,
  })
  destinationOrgUnitId: string | null;
}
