import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BillingCycle } from '../../domain/value-objects/subscription.enums';

export class CreateSubscriptionPlanCommand {
  @ApiProperty({
    description: 'The name of the subscription plan',
    example: 'Enterprise Tier',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Price amount', example: 999.99 })
  @IsNumber()
  priceAmount: number;

  @ApiProperty({ description: 'Price currency', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  priceCurrency: string;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'List of features included in the plan',
    type: [String],
    example: ['Unlimited API calls', '24/7 Support'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}
