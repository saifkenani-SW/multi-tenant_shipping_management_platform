import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateTenantPricingSettingsDto {
  @ApiPropertyOptional({
    description: 'Divisor used for volumetric weight calculation',
  })
  @IsNumber()
  @IsOptional()
  volumetricDivisor?: number;

  @ApiPropertyOptional({
    description: 'Default billing currency for the tenant',
    enum: Currency,
  })
  @IsEnum(Currency)
  @IsOptional()
  defaultCurrency?: Currency;
}
