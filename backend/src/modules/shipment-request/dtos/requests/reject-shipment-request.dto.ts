import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectShipmentRequestDto {
  @ApiPropertyOptional({ example: 'Outside our delivery zone' })
  @IsString()
  @IsOptional()
  reason?: string;
}
