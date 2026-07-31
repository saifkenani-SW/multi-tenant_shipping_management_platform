import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ description: 'The ID of the subscription plan to assign' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
