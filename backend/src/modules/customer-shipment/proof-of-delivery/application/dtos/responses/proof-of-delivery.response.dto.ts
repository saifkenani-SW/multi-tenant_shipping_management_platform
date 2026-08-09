import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionMethod } from '@prisma/client';

export class ProofOfDeliveryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  parcelId: string;

  @ApiProperty()
  deliveredByEmployeeId: string;

  @ApiProperty({ enum: CollectionMethod })
  collectionMethod: CollectionMethod;

  @ApiProperty()
  receivedByName: string;

  @ApiPropertyOptional({ nullable: true })
  receivedByNationalId?: string | null;

  @ApiProperty()
  otpVerified: boolean;

  @ApiPropertyOptional({ nullable: true })
  otpVerifiedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Storage key, resolve to a URL through the storage provider',
    nullable: true,
  })
  signatureKey?: string | null;

  @ApiPropertyOptional({ nullable: true })
  idPhotoKey?: string | null;

  @ApiPropertyOptional({ nullable: true })
  parcelPhotoKey?: string | null;

  @ApiPropertyOptional({ nullable: true })
  additionalPhotoKey?: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryLat?: number | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryLng?: number | null;

  @ApiProperty()
  createdAt: Date;
}
