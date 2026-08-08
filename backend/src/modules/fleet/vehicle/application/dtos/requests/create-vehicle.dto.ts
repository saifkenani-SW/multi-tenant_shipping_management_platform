import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleStatus } from '../../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Plate number unique within the tenant',
    example: 'DAM-12345',
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  plateNumber: string;

  @ApiPropertyOptional({ enum: VehicleType, example: VehicleType.VAN })
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @ApiPropertyOptional({
    description: 'Maximum payload capacity in kilograms',
    example: 1250.5,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  capacityKg?: number;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;
}
