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
  max_branches?: number;

  @ApiPropertyOptional({ description: 'Max allowed warehouses', default: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_warehouses?: number;

  @ApiPropertyOptional({ description: 'Max allowed employees', default: 20 })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_employees?: number;

  @ApiPropertyOptional({ description: 'Max allowed vehicles', default: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_vehicles?: number;

  @ApiPropertyOptional({ description: 'Max allowed zones', default: 3 })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_zones?: number;

  @ApiPropertyOptional({ description: 'Max monthly shipments allowed' })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_monthly_shipments?: number;

  @ApiPropertyOptional({ description: 'Max monthly parcels allowed' })
  @IsInt()
  @Min(0)
  @IsOptional()
  max_monthly_parcels?: number;

  @ApiPropertyOptional({ description: 'Monthly price', default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price_monthly?: number;

  @ApiPropertyOptional({ description: 'Yearly price' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price_yearly?: number;

  @ApiPropertyOptional({ description: 'Is the plan active?', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
