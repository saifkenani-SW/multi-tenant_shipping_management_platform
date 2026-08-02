import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';
import { ShipmentStatus } from '../../../domain/enums/shipment-status.enum';

export class CustomerShipmentQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specific tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific sender customer profile ID' })
  @IsUUID()
  @IsOptional()
  senderCustomerProfileId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific receiver customer profile ID' })
  @IsUUID()
  @IsOptional()
  receiverCustomerProfileId?: string;

  @ApiPropertyOptional({
    description: 'Filter by shipment status',
    enum: ShipmentStatus,
  })
  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  @ApiPropertyOptional({ description: 'Search term for receiver name or phone' })
  @IsString()
  @IsOptional()
  search?: string;
}
