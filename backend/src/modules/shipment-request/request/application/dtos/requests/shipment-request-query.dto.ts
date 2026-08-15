import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { RequestStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../../../common/utils/phone.util';

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

  @ApiPropertyOptional({ 
    description: 'Filter by sender phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  senderPhone?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by receiver phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '0991234567',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  receiverPhone?: string;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  status?: RequestStatus;
}
