import { ApiProperty } from '@nestjs/swagger';
import { ParcelStatus } from '../../../domain/enums/parcel-status.enum';
import { ParcelCondition } from '../../../domain/enums/parcel-condition.enum';

export class ParcelDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  trackingNumber: string;

  @ApiProperty()
  actualWeightKg: number;

  @ApiProperty()
  lengthCm: number;

  @ApiProperty()
  widthCm: number;

  @ApiProperty()
  heightCm: number;

  @ApiProperty({ required: false, nullable: true })
  volumetricWeightKg: number | null;

  @ApiProperty({ enum: ParcelStatus })
  status: ParcelStatus;

  @ApiProperty({ enum: ParcelCondition })
  condition: ParcelCondition;

  @ApiProperty({ required: false, nullable: true })
  currentOrgUnitId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
