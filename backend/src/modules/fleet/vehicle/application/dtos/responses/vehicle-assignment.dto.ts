import { ApiProperty } from '@nestjs/swagger';

export class VehicleAssignmentDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Assigned employee (driver) identifier' })
  employeeId: string;

  @ApiProperty({ description: 'Vehicle identifier' })
  vehicleId: string;

  @ApiProperty({ description: 'Whether the assignment is currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'When the driver was assigned' })
  assignedAt: Date;

  @ApiProperty({
    description: 'When the assignment was released',
    nullable: true,
  })
  removedAt: Date | null;

  @ApiProperty({ description: 'Employee full name', required: false })
  employeeName?: string;

  @ApiProperty({ description: 'Employee code', required: false })
  employeeCode?: string;

  @ApiProperty({ description: 'Vehicle plate number', required: false })
  vehiclePlateNumber?: string;
}
