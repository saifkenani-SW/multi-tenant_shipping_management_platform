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

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [CustomerShipmentController],
  providers: [
    CustomerShipmentCommandRepository,
    CustomerShipmentQueryRepository,
    ParcelQueryRepository,
    CustomerShipmentCommandService,
    CustomerShipmentQueryService,
    ShipmentFacade,
  ],
  exports: [ShipmentFacade],
})
export class ShipmentModule {}
