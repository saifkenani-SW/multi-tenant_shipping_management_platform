import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantDeliverySettingsDto {
  @ApiPropertyOptional({ description: 'Require OTP for delivery' })
  @IsBoolean()
  @IsOptional()
  requireOtp?: boolean;

  @ApiPropertyOptional({
    description: 'Require customer signature for delivery',
  })
  @IsBoolean()
  @IsOptional()
  requireSignature?: boolean;

  @ApiPropertyOptional({ description: 'Require proof photo upon delivery' })
  @IsBoolean()
  @IsOptional()
  requireProofPhoto?: boolean;

  @ApiPropertyOptional({ description: 'Require ID photo upon delivery' })
  @IsBoolean()
  @IsOptional()
  requireIdPhoto?: boolean;

  @ApiPropertyOptional({
    description: 'Allow representative to receive the shipment',
  })
  @IsBoolean()
  @IsOptional()
  allowRepresentative?: boolean;
}
