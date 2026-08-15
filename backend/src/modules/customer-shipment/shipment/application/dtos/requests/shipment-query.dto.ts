import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../../../common/utils/phone.util';

export class ShipmentQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by owning tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by sender phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  senderPhone?: string;

  @ApiPropertyOptional({ description: 'Filter by origin organization unit' })
  @IsUUID()
  @IsOptional()
  originOrgUnitId?: string;

  @ApiPropertyOptional({
    description: 'Filter by destination organization unit',
  })
  @IsUUID()
  @IsOptional()
  destinationOrgUnitId?: string;

  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by receiver phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '0991234567',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  receiverPhone?: string;
}
