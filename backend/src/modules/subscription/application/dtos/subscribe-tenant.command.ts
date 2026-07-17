import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeTenantCommand {
  @ApiProperty({ description: 'The ID of the tenant subscribing' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({
    description: 'The ID of the subscription plan to subscribe to',
  })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    description: 'Start date of the subscription',
    example: '2023-10-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date of the subscription',
    example: '2024-10-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
