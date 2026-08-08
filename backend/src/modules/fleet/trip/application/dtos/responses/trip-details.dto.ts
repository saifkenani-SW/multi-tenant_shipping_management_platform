import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export class TripDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Employee (driver) operating this trip' })
  driverId: string;

  @ApiProperty({ description: 'Vehicle used for this trip', nullable: true })
  vehicleId: string | null;

  @ApiProperty({ description: 'Organization unit the trip departs from' })
  originOrgUnitId: string;

  @ApiProperty({ description: 'Organization unit the trip arrives at' })
  destinationOrgUnitId: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ description: 'Planned departure time', nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ description: 'Actual departure time', nullable: true })
  startedAt: Date | null;

  @ApiProperty({
    description: 'Completion or cancellation time',
    nullable: true,
  })
  endedAt: Date | null;

  @ApiProperty({ description: 'Operational notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
