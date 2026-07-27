import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelShipmentRequestDto {
  @ApiPropertyOptional({ example: 'Changed my mind' })
  @IsString()
  @IsOptional()
  reason?: string;
}
