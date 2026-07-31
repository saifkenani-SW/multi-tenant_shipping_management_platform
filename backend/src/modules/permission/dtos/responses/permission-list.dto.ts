import { ApiProperty } from '@nestjs/swagger';

export class PermissionListDto {
  @ApiProperty({
    description: 'Unique identifier for the permission',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  id: string;

  @ApiProperty({
    description: 'Unique permission name as defined in code',
    example: 'CREATE_PARCEL',
  })
  name: string;

  @ApiProperty({
    description: 'Resource the permission applies to',
    example: 'parcel',
  })
  resource: string;

  @ApiProperty({
    description: 'Action the permission grants on the resource',
    example: 'create',
  })
  action: string;
}

export class PaginatedPermissionListDto {
  @ApiProperty({
    description: 'List of permissions',
    type: [PermissionListDto],
  })
  data: PermissionListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 10 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
