import { Module } from '@nestjs/common';
import { ShipmentRequestController } from './shipment-request.controller';
import { ShipmentRequestCommandService } from './services/shipment-request.command.service';
import { ShipmentRequestQueryService } from './services/shipment-request.query.service';
import { ShipmentRequestCommandRepository } from './repositories/shipment-request.command.repository';
import { ShipmentRequestQueryRepository } from './repositories/shipment-request.query.repository';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { ShipmentRequestAccessPolicy } from './policies/shipment-request-access.policy';

@Module({
  imports: [CacheModule, DatabaseModule, AuthModule, CustomerModule],
  controllers: [ShipmentRequestController],
  providers: [
    ShipmentRequestAccessPolicy,
    {
      provide: 'IShipmentRequestCommandRepository',
      useClass: ShipmentRequestCommandRepository,
    },
    {
      provide: 'IShipmentRequestQueryRepository',
      useClass: ShipmentRequestQueryRepository,
    },
    {
      provide: 'IShipmentRequestCommandService',
      useClass: ShipmentRequestCommandService,
    },
    {
      provide: 'IShipmentRequestQueryService',
      useClass: ShipmentRequestQueryService,
    },
  ],
  exports: ['IShipmentRequestCommandService', 'IShipmentRequestQueryService'],
})
export class ShipmentRequestModule {}
