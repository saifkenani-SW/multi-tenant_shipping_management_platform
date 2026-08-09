import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { GlobalLocationModule } from '../global-location/global-location.module';

// Pricing Aggregate
import { ZonePricingController } from './pricing/presentation/controllers/zone-pricing.controller';
import { ZonePricingCommandService } from './pricing/application/services/zone-pricing.command.service';
import { ZonePricingResolutionService } from './pricing/application/services/zone-pricing-resolution.service';
import { PricingCalculationService } from './pricing/application/services/pricing-calculation.service';
import { ZonePricingCommandRepository } from './pricing/infrastructure/repositories/zone-pricing.command.repository';
import { ZonePricingQueryRepository } from './pricing/infrastructure/repositories/zone-pricing.query.repository';

// Quotation Aggregate
import { QuotationGenerationService } from './quotation/application/services/quotation-generation.service';
import { QuotationCommandService } from './quotation/application/services/quotation.command.service';
import { QuotationCommandRepository } from './quotation/infrastructure/repositories/quotation.command.repository';
import { QuotationQueryService } from './quotation/application/services/quotation.query.service';
import { QuotationQueryRepository } from './quotation/infrastructure/repositories/quotation.query.repository';
import { QuotationController } from './quotation/presentation/controllers/quotation.controller';

// Request Aggregate
import { ShipmentRequestController } from './request/presentation/controllers/shipment-request.controller';
import { ShipmentRequestCommandService } from './request/application/services/shipment-request.command.service';
import { ShipmentRequestCommandRepository } from './request/infrastructure/repositories/shipment-request.command.repository';
import { ShipmentRequestQueryService } from './request/application/services/shipment-request.query.service';
import { ShipmentRequestQueryRepository } from './request/infrastructure/repositories/shipment-request.query.repository';
import { ShipmentRequestVisibilityScope } from './authorization/scopes/shipment-request-visibility.scope';

// Facades
import { ShipmentRequestFacade } from './facades/shipment-request.facade';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [OrganizationModule, GlobalLocationModule, TenantModule],
  controllers: [ZonePricingController, ShipmentRequestController, QuotationController],
  providers: [
    ZonePricingCommandService,
    ZonePricingResolutionService,
    PricingCalculationService,
    QuotationGenerationService,
    QuotationCommandService,
    QuotationCommandRepository,
    QuotationQueryService,
    QuotationQueryRepository,
    ZonePricingCommandRepository,
    ZonePricingQueryRepository,
    ShipmentRequestCommandService,
    ShipmentRequestCommandRepository,
    ShipmentRequestQueryService,
    ShipmentRequestQueryRepository,
    ShipmentRequestVisibilityScope,
    ShipmentRequestFacade,
  ],
  exports: [ShipmentRequestFacade],
})
export class ShipmentRequestModule {}

