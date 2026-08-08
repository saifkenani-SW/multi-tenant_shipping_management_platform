import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class VehicleListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Plate number unique within the tenant' })
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, nullable: true })
  type: VehicleType | null;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;
}

export class PaginatedVehicleListDto {
  @ApiProperty({ description: 'List of vehicles', type: [VehicleListDto] })
  data: VehicleListDto[];

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
