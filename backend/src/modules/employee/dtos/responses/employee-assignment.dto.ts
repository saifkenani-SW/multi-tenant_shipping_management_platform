import { ApiProperty } from '@nestjs/swagger';

export class EmployeeAssignmentDto {
  @ApiProperty({ description: 'Assignment identifier' })
  id: string;

  @ApiProperty({ description: 'Organization unit the employee works at' })
  organizationUnitId: string;

  @ApiProperty({ description: 'Organization unit name', nullable: true })
  organizationUnitName: string | null;

  @ApiProperty({ description: 'Whether the assignment is current' })
  isActive: boolean;

  @ApiProperty({
    description: 'Roles granted at this assignment',
    type: [String],
  })
  roleIds: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}
