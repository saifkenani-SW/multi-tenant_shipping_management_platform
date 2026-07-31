import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Plan name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Max allowed branches', default: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxBranches?: number;

  @ApiPropertyOptional({ description: 'Max allowed warehouses', default: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxWarehouses?: number;

  @ApiPropertyOptional({ description: 'Max allowed employees', default: 20 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxEmployees?: number;

  @ApiPropertyOptional({ description: 'Max allowed vehicles', default: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxVehicles?: number;

  @ApiPropertyOptional({ description: 'Max allowed zones', default: 3 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxZones?: number;

  @ApiPropertyOptional({ description: 'Max monthly shipments allowed' })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxMonthlyShipments?: number;

  @ApiPropertyOptional({ description: 'Max monthly parcels allowed' })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxMonthlyParcels?: number;

  @ApiPropertyOptional({ description: 'Monthly price', default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  priceMonthly?: number;

  @ApiPropertyOptional({ description: 'Yearly price' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  priceYearly?: number;

  @ApiPropertyOptional({ description: 'Is the plan active?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
