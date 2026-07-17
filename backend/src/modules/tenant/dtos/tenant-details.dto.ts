import { ApiProperty } from '@nestjs/swagger';

export class TenantDetailsDto {
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

  @ApiProperty({
    description: 'Tax registration number',
    example: 'TAX-123456789',
  })
  taxNumber: string;

  @ApiProperty({
    description: 'Primary contact email',
    example: 'contact@globallogistics.com',
  })
  contactEmail: string;

  @ApiProperty({ description: 'Tenant current status', example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-02-01T15:30:00Z',
  })
  updatedAt: Date;
}
