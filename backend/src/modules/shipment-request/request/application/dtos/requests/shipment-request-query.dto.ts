import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { RequestStatus } from '@prisma/client';

export class ShipmentRequestQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  customerProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  targetTenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  originGlobalLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(7)
  destinationGlobalLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  status?: RequestStatus;
}
