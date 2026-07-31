import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenewSubscriptionDto {
  @ApiProperty({
    description: 'The ID of the subscription plan to renew or upgrade to',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
