import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export class TripListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'ID of the assigned driver', required: false })
  driverId: string | null;

  @ApiProperty({ description: 'Name of the assigned driver', required: false })
  driverName?: string;

  @ApiProperty({ description: 'Vehicle used for this trip', nullable: true })
  vehicleId: string | null;

  @ApiProperty({ description: 'Plate number of the vehicle', required: false })
  vehiclePlateNumber?: string;

  @ApiProperty({ description: 'ID of the origin organization unit' })
  originOrgUnitId: string;

  @ApiProperty({ description: 'Name of the origin organization unit', required: false })
  originOrgUnitName?: string;

  @ApiProperty({ description: 'ID of the destination organization unit' })
  destinationOrgUnitId: string;

  @ApiProperty({ description: 'Name of the destination organization unit', required: false })
  destinationOrgUnitName?: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ description: 'Planned departure time', nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ description: 'Employee who created the trip', nullable: true })
  createdByEmployeeId: string | null;

  @ApiProperty({
    description: 'Name of the employee who created the trip',
    nullable: true,
  })
  createdByEmployeeName: string | null;
}

export class PaginatedTripListDto {
  @ApiProperty({ description: 'List of trips', type: [TripListDto] })
  data: TripListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 40 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
