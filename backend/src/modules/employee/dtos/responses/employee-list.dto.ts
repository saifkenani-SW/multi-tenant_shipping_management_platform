import { ApiProperty } from '@nestjs/swagger';

export class EmployeeListDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({
    description: 'Code unique within the tenant',
    example: 'EMP-0142',
  })
  employeeCode: string;

  @ApiProperty({ description: 'Full name', example: 'Sara Haddad' })
  fullName: string;

  @ApiProperty({ description: 'Login email', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Whether the employee can still work' })
  isActive: boolean;
}

export class PaginatedEmployeeListDto {
  @ApiProperty({ description: 'List of employees', type: [EmployeeListDto] })
  data: EmployeeListDto[];

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
