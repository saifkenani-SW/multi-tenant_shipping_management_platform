import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { CustomerShipmentCommandRepository } from './infrastructure/repositories/customer-shipment.command.repository';
import { CustomerShipmentQueryRepository } from './infrastructure/repositories/customer-shipment.query.repository';
import { ParcelQueryRepository } from './infrastructure/repositories/parcel.query.repository';
import { CustomerShipmentCommandService } from './application/services/customer-shipment.command.service';
import { CustomerShipmentQueryService } from './application/services/customer-shipment.query.service';
import { CustomerShipmentController } from './presentation/controllers/customer-shipment.controller';
import { ShipmentFacade } from './application/facades/shipment.facade';

import { ParcelQueryService } from './application/services/parcel.query.service';
import { ParcelController } from './presentation/controllers/parcel.controller';
import { TrackingModule } from '../tracking/tracking.module';
import { LabelGeneratorModule } from '../../packages/label-generator/label-generator.module';
import { PdfGeneratorModule } from '../../packages/pdf-generator/pdf-generator.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    TrackingModule,
    LabelGeneratorModule,
    PdfGeneratorModule,
  ],
  controllers: [CustomerShipmentController, ParcelController],
  providers: [
    CustomerShipmentCommandRepository,
    CustomerShipmentQueryRepository,
    ParcelQueryRepository,
    CustomerShipmentCommandService,
    CustomerShipmentQueryService,
    ParcelQueryService,
    ShipmentFacade,
  ],
  exports: [ShipmentFacade],
})
export class ShipmentModule {}
