import { Module } from '@nestjs/common';
import { ZonePricingController } from './presentation/controllers/zone-pricing.controller';
import { ZonePricingCommandService } from './application/services/zone-pricing.command.service';
import { ZonePricingQueryService } from './application/services/zone-pricing.query.service';
import { ZonePricingCommandRepository } from './infrastructure/repositories/zone-pricing.command.repository';
import { ZonePricingQueryRepository } from './infrastructure/repositories/zone-pricing.query.repository';

import { OrganizationModule } from '../../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [ZonePricingController],
  providers: [
    ZonePricingCommandService,
    ZonePricingQueryService,
    ZonePricingCommandRepository,
    ZonePricingQueryRepository,
  ],
  exports: [ZonePricingCommandService, ZonePricingQueryService],
})
export class PricingModule {}
