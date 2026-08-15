import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../../../common/pagination';
import { ManifestStatus } from '../../../domain/enums/manifest-status.enum';

export class ManifestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ManifestStatus })
  @IsEnum(ManifestStatus)
  @IsOptional()
  status?: ManifestStatus;

  @ApiPropertyOptional({ description: 'Filter by tenant (Platform Owner only)', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by driver', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by trip', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Filter by origin', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  originOrgUnitId?: string;

  @ApiPropertyOptional({ description: 'Filter by destination', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  destinationOrgUnitId?: string;
}
