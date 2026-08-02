import { ApiProperty } from '@nestjs/swagger';

export class RoleListDto {
  @ApiProperty({
    description: 'Unique identifier for the role',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  id: string;

  @ApiProperty({ description: 'Role name', example: 'Branch Manager' })
  name: string;

  @ApiProperty({
    description: 'What the role is for',
    example: 'Runs day-to-day operations for a single branch',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Whether the role can still be granted' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of permissions granted', example: 4 })
  permissionCount: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;
}

export class PaginatedRoleListDto {
  @ApiProperty({ description: 'List of roles', type: [RoleListDto] })
  data: RoleListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 25 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
