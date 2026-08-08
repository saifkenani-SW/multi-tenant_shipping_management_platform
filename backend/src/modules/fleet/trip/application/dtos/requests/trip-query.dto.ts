import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../../../common/pagination';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

export class TripQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TripStatus })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiPropertyOptional({ description: 'Filter by driver', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filter by origin', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  originOrgUnitId?: string;

  @ApiPropertyOptional({ description: 'Filter by destination', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  destinationOrgUnitId?: string;
}
