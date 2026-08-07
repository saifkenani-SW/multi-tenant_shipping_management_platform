import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateZonePricingDto } from './create-zone-pricing.dto';

export class UpdateZonePricingDto extends PartialType(
  OmitType(CreateZonePricingDto, [
    'originZoneId',
    'destinationZoneId',
    'serviceLevel',
    'isBidirectional',
  ] as const),
) {}
