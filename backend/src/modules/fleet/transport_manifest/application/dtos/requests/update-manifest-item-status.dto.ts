import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ManifestItemStatus } from '../../../domain/enums/manifest-item-status.enum';

/**
 * PENDING_LOAD is the creation state and cannot be moved back to, so it is not
 * an accepted target here.
 */
export const ManifestItemTargetStatus = {
  LOADED: ManifestItemStatus.LOADED,
  UNLOADED: ManifestItemStatus.UNLOADED,
  MISSING: ManifestItemStatus.MISSING,
} as const;

export type ManifestItemTargetStatus =
  (typeof ManifestItemTargetStatus)[keyof typeof ManifestItemTargetStatus];

export class UpdateManifestItemStatusDto {
  @ApiProperty({
    enum: ManifestItemTargetStatus,
    description: 'New state of this parcel on the manifest',
  })
  @IsEnum(ManifestItemTargetStatus)
  @IsNotEmpty()
  status: ManifestItemTargetStatus;
}
