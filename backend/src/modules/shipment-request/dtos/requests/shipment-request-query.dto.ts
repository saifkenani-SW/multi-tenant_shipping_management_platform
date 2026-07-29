import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RequestStatus } from '@prisma/client';
import { BasePaginationDto } from '../../../../core/dtos/base-pagination.dto';

export class ShipmentRequestQueryDto extends BasePaginationDto {
  @ApiPropertyOptional({ enum: RequestStatus })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;
}
