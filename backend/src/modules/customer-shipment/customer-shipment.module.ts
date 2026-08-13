import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import { LabelGeneratorModule } from '../../packages/label-generator';
import { PdfGeneratorModule } from '../../packages/pdf-generator';
import { TrackingModule } from '../tracking/tracking.module';
import { TenantModule } from '../tenant/tenant.module';
import { CustomerModule } from '../customer/customer.module';
import { EmployeeModule } from '../employee/employee.module';
import { ShipmentRequestModule } from '../shipment-request/shipment-request.module';
import { BillingModule } from '../billing/billing.module';

// Shipment
import { ShipmentController } from './shipment/presentation/controllers/shipment.controller';
import { ShipmentCommandService } from './shipment/application/services/shipment.command.service';
import { ShipmentQueryService } from './shipment/application/services/shipment.query.service';
import { ShipmentStatusRecalculator } from './shipment/application/services/shipment-status.recalculator';
import { ShipmentCommandRepository } from './shipment/infrastructure/repositories/shipment.command.repository';
import { ShipmentQueryRepository } from './shipment/infrastructure/repositories/shipment.query.repository';
import { ShipmentMapper } from './shipment/application/mappers/shipment.mapper';
import { ShipmentPolicy } from './shipment/domain/authorization/policies/shipment.policy';
import { ShipmentStrategyRegistry } from './shipment/domain/authorization/policies/strategies/registry/shipment-strategy.registry';
import { CreateShipmentStrategy } from './shipment/domain/authorization/policies/strategies/create-shipment.strategy';
import { ViewShipmentStrategy } from './shipment/domain/authorization/policies/strategies/view-shipment.strategy';
import { UpdateShipmentStrategy } from './shipment/domain/authorization/policies/strategies/update-shipment.strategy';
import { CancelShipmentStrategy } from './shipment/domain/authorization/policies/strategies/cancel-shipment.strategy';
import { ShipmentAbility } from './shipment/domain/authorization/abilities/shipment.ability';
import { ShipmentVisibilityScope } from './shipment/domain/authorization/scopes/shipment-visibility.scope';

// Parcel
import { ParcelController } from './parcel/presentation/controllers/parcel.controller';
import { ParcelCommandService } from './parcel/application/services/parcel.command.service';
import { ParcelQueryService } from './parcel/application/services/parcel.query.service';
import { ParcelCommandRepository } from './parcel/infrastructure/repositories/parcel.command.repository';
import { ParcelQueryRepository } from './parcel/infrastructure/repositories/parcel.query.repository';
import { ParcelMapper } from './parcel/application/mappers/parcel.mapper';
import { ParcelPolicy } from './parcel/domain/authorization/policies/parcel.policy';
import { ParcelStrategyRegistry } from './parcel/domain/authorization/policies/strategies/registry/parcel-strategy.registry';
import { ViewParcelStrategy } from './parcel/domain/authorization/policies/strategies/view-parcel.strategy';
import { UpdateParcelStatusStrategy } from './parcel/domain/authorization/policies/strategies/update-parcel-status.strategy';
import { ParcelAbility } from './parcel/domain/authorization/abilities/parcel.ability';
import { ParcelVisibilityScope } from './parcel/domain/authorization/scopes/parcel-visibility.scope';

// Proof of Delivery
import { ProofOfDeliveryController } from './proof-of-delivery/presentation/controllers/proof-of-delivery.controller';
import { ProofOfDeliveryCommandService } from './proof-of-delivery/application/services/proof-of-delivery.command.service';
import { ProofOfDeliveryQueryService } from './proof-of-delivery/application/services/proof-of-delivery.query.service';
import { ProofOfDeliveryCommandRepository } from './proof-of-delivery/infrastructure/repositories/proof-of-delivery.command.repository';
import { ProofOfDeliveryQueryRepository } from './proof-of-delivery/infrastructure/repositories/proof-of-delivery.query.repository';
import { ProofOfDeliveryMapper } from './proof-of-delivery/application/mappers/proof-of-delivery.mapper';
import { PodPolicy } from './proof-of-delivery/domain/authorization/policies/pod.policy';
import { PodStrategyRegistry } from './proof-of-delivery/domain/authorization/policies/strategies/registry/pod-strategy.registry';
import { RecordPodStrategy } from './proof-of-delivery/domain/authorization/policies/strategies/record-pod.strategy';
import { ViewPodStrategy } from './proof-of-delivery/domain/authorization/policies/strategies/view-pod.strategy';
import { PodAbility } from './proof-of-delivery/domain/authorization/abilities/pod.ability';
import { PodVisibilityScope } from './proof-of-delivery/domain/authorization/scopes/pod-visibility.scope';

import { CustomerShipmentFacade } from './facades/customer-shipment.facade';

/**
 * Customer Shipment module.
 *
 * Groups three aggregates behind one boundary: the shipment, its parcels, and
 * the proof of delivery for each parcel.
 *
 * Only CustomerShipmentFacade is exported. Outward, the module reaches other
 * modules solely through their own facades — TenantFacade for settings and
 * pricing, CustomerFacade to confirm a profile exists, ShipmentRequestFacade to
 * mark a request converted, and TrackingFacade to append movements.
 */
@Module({
  imports: [
    DatabaseModule,
    CaslModule.forFeature([ShipmentAbility, ParcelAbility, PodAbility]),
    LabelGeneratorModule,
    PdfGeneratorModule,
    TrackingModule,
    TenantModule,
    CustomerModule,
    EmployeeModule,
    ShipmentRequestModule,
    BillingModule,
  ],
  controllers: [
    ShipmentController,
    ParcelController,
    ProofOfDeliveryController,
  ],
  providers: [
    // Shipment
    ShipmentCommandService,
    ShipmentQueryService,
    ShipmentStatusRecalculator,
    ShipmentCommandRepository,
    ShipmentQueryRepository,
    ShipmentMapper,
    ShipmentPolicy,
    ShipmentStrategyRegistry,
    CreateShipmentStrategy,
    ViewShipmentStrategy,
    UpdateShipmentStrategy,
    CancelShipmentStrategy,
    ShipmentAbility,
    ShipmentVisibilityScope,

    // Parcel
    ParcelCommandService,
    ParcelQueryService,
    ParcelCommandRepository,
    ParcelQueryRepository,
    ParcelMapper,
    ParcelPolicy,
    ParcelStrategyRegistry,
    ViewParcelStrategy,
    UpdateParcelStatusStrategy,
    ParcelAbility,
    ParcelVisibilityScope,

    // Proof of Delivery
    ProofOfDeliveryCommandService,
    ProofOfDeliveryQueryService,
    ProofOfDeliveryCommandRepository,
    ProofOfDeliveryQueryRepository,
    ProofOfDeliveryMapper,
    PodPolicy,
    PodStrategyRegistry,
    RecordPodStrategy,
    ViewPodStrategy,
    PodAbility,
    PodVisibilityScope,

    CustomerShipmentFacade,
  ],
  exports: [CustomerShipmentFacade],
})
export class CustomerShipmentModule {}
