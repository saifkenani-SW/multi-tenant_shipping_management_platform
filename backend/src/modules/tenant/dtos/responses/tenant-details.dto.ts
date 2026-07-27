import { ApiProperty } from '@nestjs/swagger';
import type { TenantCapabilities } from '../../authorization/capabilities/tenant.capabilities.interface';

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
    nullable: true,
  })
  taxNumber: string | null;

  @ApiProperty({
    description: 'Primary email address',
    example: 'contact@globallogistics.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'Tenant phone number',
    example: '+963123456789',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Tenant logo URL',
    example: 'https://cdn.example.com/tenant-logo.png',
    nullable: true,
  })
  logoUrl: string | null;

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

  @ApiProperty({
    description: 'Date when the tenant was suspended',
    example: '2023-03-01T10:00:00Z',
    nullable: true,
  })
  suspendedAt: Date | null;

  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Fraud review',
    nullable: true,
  })
  suspendedReason: string | null;

  @ApiProperty({
    description: 'Operations available to the current principal',
    example: { canUpdate: true, canDelete: false },
  })
  capabilities: TenantCapabilities;
}
