import { ApiProperty } from '@nestjs/swagger';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';

export class ManifestListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

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

  @ApiProperty({ description: 'Number of parcels on this manifest' })
  itemCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class PaginatedManifestListDto {
  @ApiProperty({ description: 'List of manifests', type: [ManifestListDto] })
  data: ManifestListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 40 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    scope?: any;
  };
}
