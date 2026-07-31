import { ApiProperty } from '@nestjs/swagger';

import { EmployeeAssignmentDto } from './employee-assignment.dto';

export class EmployeeDetailsDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Linked user account identifier' })
  userId: string;

  @ApiProperty({ description: 'Code unique within the tenant' })
  employeeCode: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'National identifier', nullable: true })
  nationalId: string | null;

  @ApiProperty({ description: 'Login email', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Contact phone', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Whether the employee can still work' })
  isActive: boolean;

  @ApiProperty({
    description: 'When the employee was deactivated',
    nullable: true,
  })
  deactivatedAt: Date | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Units the employee is assigned to, with their roles',
    type: [EmployeeAssignmentDto],
  })
  assignments: EmployeeAssignmentDto[];
}
