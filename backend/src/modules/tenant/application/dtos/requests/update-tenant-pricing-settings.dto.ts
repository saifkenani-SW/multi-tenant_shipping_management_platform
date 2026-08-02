import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTenantPricingSettingsDto {
  @ApiPropertyOptional({
    description: 'Divisor used for volumetric weight calculation',
  })
  @IsNumber()
  @IsOptional()
  volumetricDivisor?: number;

  @ApiPropertyOptional({ description: 'Default currency code for the tenant' })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;
}
