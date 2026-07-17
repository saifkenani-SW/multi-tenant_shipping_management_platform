import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionHistoryDto {
  @ApiProperty({
    description: 'History Record ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: 'Plan ID that was subscribed to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  planId: string;

  @ApiProperty({
    description: 'Start date of this history period',
    example: '2023-01-01T12:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of this history period',
    example: '2024-01-01T12:00:00Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'When this record was recorded',
    example: '2023-01-01T12:00:00Z',
  })
  recordedAt: Date;
}

export class TenantSubscriptionDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Current Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  planId: string;

  @ApiProperty({ description: 'Start date', example: '2023-01-01T12:00:00Z' })
  startDate: Date;

  @ApiProperty({ description: 'End date', example: '2024-01-01T12:00:00Z' })
  endDate: Date;

  @ApiProperty({ description: 'Subscription Status', example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    type: [SubscriptionHistoryDto],
    description: 'History of subscriptions',
  })
  history: SubscriptionHistoryDto[];

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
