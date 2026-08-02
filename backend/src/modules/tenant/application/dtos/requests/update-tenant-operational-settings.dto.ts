import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTenantOperationalSettingsDto {
  @ApiPropertyOptional({
    description: 'Prefix for tracking numbers (e.g. SYR-)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  trackingPrefix?: string;

  @ApiPropertyOptional({
    description: 'Automatically close shipment after collection',
  })
  @IsBoolean()
  @IsOptional()
  autoCloseShipmentAfterCollection?: boolean;

  @ApiPropertyOptional({ description: 'Allow closed shipments to be reopened' })
  @IsBoolean()
  @IsOptional()
  allowShipmentReopen?: boolean;

  @ApiPropertyOptional({ description: 'Allow trip cancellation after loading' })
  @IsBoolean()
  @IsOptional()
  allowTripCancellationAfterLoading?: boolean;

  @ApiPropertyOptional({
    description: 'Require manager approval before trip departure',
  })
  @IsBoolean()
  @IsOptional()
  requireManagerBeforeTripDeparture?: boolean;

  @ApiPropertyOptional({ description: 'Allow return flow after collection' })
  @IsBoolean()
  @IsOptional()
  allowReturnAfterCollection?: boolean;

  @ApiPropertyOptional({ description: 'Validity of quotations in hours' })
  @IsNumber()
  @IsOptional()
  quotationValidityHours?: number;
}
