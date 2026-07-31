import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReasonDto {
  @ApiPropertyOptional({ description: 'Reason for action' })
  @IsString()
  @IsOptional()
  reason?: string;
}
export class SuspendSubscriptionDto extends ReasonDto {}
export class CancelSubscriptionDto extends ReasonDto {}
