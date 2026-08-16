import { ApiProperty } from '@nestjs/swagger';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';
import { ManifestItemDto } from './manifest-item.dto';

export class ManifestDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Trip this manifest travels on' })
  tripId: string;

  @ApiProperty({ description: 'Organization unit the manifest is loaded at' })
  originOrgUnitId: string;

  @ApiProperty({ description: 'Name of the origin organization unit', required: false })
  originOrgUnitName?: string;

  @ApiProperty({ description: 'Organization unit the manifest is unloaded at' })
  destinationOrgUnitId: string;

  @ApiProperty({ description: 'Name of the destination organization unit', required: false })
  destinationOrgUnitName?: string;

  @ApiProperty({ enum: ManifestStatus })
  status: ManifestStatus;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Parcels on this manifest',
    type: [ManifestItemDto],
  })
  items: ManifestItemDto[];
}
