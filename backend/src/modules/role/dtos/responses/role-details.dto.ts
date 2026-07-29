import { ApiProperty } from '@nestjs/swagger';

import { PermissionListDto } from '../../../permission/dtos/responses/permission-list.dto';

export class RoleDetailsDto {
  @ApiProperty({
    description: 'Unique identifier for the role',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  tenantId: string;

  @ApiProperty({ description: 'Role name', example: 'Branch Manager' })
  name: string;

  @ApiProperty({
    description: 'What the role is for',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Whether the role can still be granted' })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Permissions granted to this role',
    type: [PermissionListDto],
  })
  permissions: PermissionListDto[];
}
