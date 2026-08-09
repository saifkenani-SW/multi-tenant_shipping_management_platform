import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class VehicleDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Plate number unique within the tenant' })
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, nullable: true })
  type: VehicleType | null;

  @ApiProperty({
    description: 'Maximum payload capacity in kilograms',
    nullable: true,
  })
  capacityKg: number | null;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
