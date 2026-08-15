import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { CustomerShipmentModule } from './customer-shipment/customer-shipment.module';
import { FleetModule } from './fleet/fleet.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { TrackingGateway } from './tracking/presentation/gateways/tracking.gateway';
import { WsContextInterceptor } from '../common/websockets/ws-context.interceptor';
import { LocationFlusherService } from './tracking/application/services/location-flusher.service';
import { TripLocationRepository } from './tracking/infrastructure/repositories/trip-location.repository';

/**
 * Hosts the WebSocket tracking gateway and the driver location flusher.
 *
 * Deliberately separate from TrackingModule to avoid a circular dependency:
 *   CustomerShipmentModule → TrackingModule → CustomerShipmentModule
 *
 * Dependency chain here is strictly one-way:
 *   TrackingGatewayModule → CustomerShipmentModule → TrackingModule
 *                         → FleetModule
 *
 * TrackingCommandService communicates with TrackingGateway exclusively via
 * EventEmitter2 events, so no import of TrackingModule is needed here.
 */
@Module({
  imports: [
    CustomerShipmentModule,
    FleetModule,
    DatabaseModule,

    // ScheduleModule enables @Cron on LocationFlusherService.
    // ScheduleModule.forRoot() may only be called once per application;
    // if FleetModule already registers it, this call is safely ignored.
    ScheduleModule.forRoot(),

    // JwtService is used by WsContextInterceptor to verify tokens.
    // Registered separately here because AuthModule does not export JwtService.
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    TrackingGateway,
    WsContextInterceptor,
    LocationFlusherService,
    TripLocationRepository,
  ],
})
export class TrackingGatewayModule {}
