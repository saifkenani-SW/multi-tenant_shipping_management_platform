import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'Plan Name', example: 'Enterprise' })
  name: string;

  @ApiProperty({ description: 'Price Amount', example: 999.99 })
  priceAmount: number;

  @ApiProperty({ description: 'Price Currency', example: 'USD' })
  priceCurrency: string;

  @ApiProperty({ description: 'Billing Cycle', example: 'MONTHLY' })
  billingCycle: string;

  @ApiProperty({
    type: [String],
    description: 'List of features',
    example: ['24/7 Support', 'Unlimited API calls'],
  })
  features: string[];

  @ApiProperty({ description: 'Status of the plan', example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;
}
