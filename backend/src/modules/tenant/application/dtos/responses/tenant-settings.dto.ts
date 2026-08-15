import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class DeliverySettingsDto {
  @ApiProperty()
  requireOtp: boolean;

  @ApiProperty()
  requireSignature: boolean;

  @ApiProperty()
  requireProofPhoto: boolean;

  @ApiProperty()
  requireIdPhoto: boolean;

  @ApiProperty()
  allowRepresentative: boolean;
}

export class OperationalSettingsDto {
  @ApiProperty({ required: false, nullable: true })
  trackingPrefix: string | null;

  @ApiProperty()
  autoCloseShipmentAfterCollection: boolean;

  @ApiProperty()
  allowShipmentReopen: boolean;

  @ApiProperty()
  allowTripCancellationAfterLoading: boolean;

  @ApiProperty()
  requireManagerBeforeTripDeparture: boolean;

  @ApiProperty()
  allowReturnAfterCollection: boolean;

  @ApiProperty()
  requireSenderNationalId: boolean;

  @ApiProperty()
  quotationValidityHours: number;
}

export class PricingSettingsDto {
  @ApiProperty()
  volumetricDivisor: number;

  @ApiProperty({ enum: Currency })
  defaultCurrency: Currency;
}

export class TenantSettingsDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty({ type: DeliverySettingsDto })
  delivery: DeliverySettingsDto;

  @ApiProperty({ type: OperationalSettingsDto })
  operational: OperationalSettingsDto;

  @ApiProperty({ type: PricingSettingsDto })
  pricing: PricingSettingsDto;
}

export class TenantPricingSettingsOnlyDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  volumetricDivisor: number;

  @ApiProperty({ enum: Currency })
  defaultCurrency: Currency;
}
