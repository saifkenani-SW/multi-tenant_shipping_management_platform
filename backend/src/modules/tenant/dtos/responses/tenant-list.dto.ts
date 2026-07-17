import { ApiProperty } from '@nestjs/swagger';

export class TenantListDto {
  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Global Logistics Inc.',
  })
  name: string;

  @ApiProperty({ description: 'Tenant current status', example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;
}

export class PaginatedTenantListDto {
  @ApiProperty({ description: 'List of tenants', type: [TenantListDto] })
  data: TenantListDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 10, total: 100 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
