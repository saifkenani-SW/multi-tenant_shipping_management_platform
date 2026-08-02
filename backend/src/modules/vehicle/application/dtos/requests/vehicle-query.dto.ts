import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common/pagination';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class VehicleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by plate number' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;
}
