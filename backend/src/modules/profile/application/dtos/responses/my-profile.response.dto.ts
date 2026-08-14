import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyProfileRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class MyProfileAssignmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationUnitId: string;

  @ApiProperty()
  organizationUnitName: string;

  @ApiProperty({ description: 'BRANCH, WAREHOUSE, HUB and so on' })
  organizationUnitType: string;

  @ApiProperty({ type: [MyProfileRoleDto] })
  roles: MyProfileRoleDto[];
}

/**
 * The vehicle a driver is currently assigned to.
 *
 * Present only for a driver who has an active assignment. A driver between
 * assignments gets null rather than an error — being unassigned is a normal
 * state, not a failure.
 */
export class MyProfileVehicleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plateNumber: string;

  @ApiProperty({ nullable: true })
  type: string | null;

  @ApiProperty({ description: 'Payload capacity in kilograms', nullable: true })
  capacityKg: number | null;

  @ApiProperty({ description: 'ACTIVE, MAINTENANCE or INACTIVE' })
  status: string;
}

/**
 * Everything the signed-in employee or driver needs to fill their own profile
 * screen, in one call.
 *
 * Assembled from three places the mobile app should not have to visit itself:
 * the employee record, the login account behind it, and — for a driver — the
 * vehicle they are currently on.
 */
export class MyProfileResponseDto {
  @ApiProperty({ description: 'Employee id, the one other records point at' })
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty({ description: 'Login account id' })
  userId: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional({ nullable: true })
  nationalId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this profile was read as a driver',
  })
  isDriver: boolean;

  @ApiProperty({
    description: 'Branches and warehouses this employee works at',
    type: [MyProfileAssignmentDto],
  })
  assignments: MyProfileAssignmentDto[];

  @ApiPropertyOptional({
    description:
      'Vehicle currently assigned to this driver. Null for an employee, or for a driver between assignments.',
    type: MyProfileVehicleDto,
    nullable: true,
  })
  vehicle?: MyProfileVehicleDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
