import { Logger, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ActionType, ParcelStatus, TripStatus } from '@prisma/client';

import { CustomerShipmentFacade } from '../../../customer-shipment/facades/customer-shipment.facade';
import { FleetFacade } from '../../../fleet/facades/fleet.facade';
import { WsContextInterceptor } from '../../../../common/websockets/ws-context.interceptor';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { LocationFlusherService } from '../../application/services/location-flusher.service';
import {
  PARCEL_MOVEMENT_APPENDED,
} from '../../events/parcel-movement-appended.event';
import type { ParcelMovementAppendedPayload } from '../../events/parcel-movement-appended.event';

/**
 * Real-time tracking gateway.
 *
 * Rooms are keyed by trip: `trip:{tripId}`.
 *
 * Supported events (client → server):
 *   subscribe_parcel_trip  — customers / employees subscribe to a trip by
 *                            parcel tracking number.
 *   driver_location        — driver pushes GPS coordinates; buffered in Redis
 *                            and broadcast live to all room subscribers.
 *
 * Supported events (server → client):
 *   subscribed             — acknowledgement after successful subscription.
 *   parcel_movement        — a new parcel movement was appended to the trip.
 *   driver_location        — live GPS coordinates from the assigned driver.
 */
@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*', credentials: false },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class TrackingGateway {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  /**
   * Drivers ping every ~3s. Re-fetching the trip on every ping is wasteful
   * and can stall GPS under load, so we cache a successful auth briefly.
   * Contract of `driver_location` is unchanged.
   */
  private readonly tripAuthCache = new Map<
    string,
    { driverId: string; tenantId: string; expiresAt: number }
  >();

  private static readonly TRIP_AUTH_TTL_MS = 20_000;

  constructor(
    private readonly customerShipmentFacade: CustomerShipmentFacade,
    private readonly fleetFacade: FleetFacade,
    private readonly requestContextService: RequestContextService,
    private readonly locationFlusher: LocationFlusherService,
  ) {}

  // ─── Subscribe: Customer / Employee ─────────────────────────────────────────

  /**
   * Subscribe to a trip's real-time channel using a parcel tracking number.
   * Authorization is handled by @Authorize on ParcelQueryService.findByTrackingNumber.
   */
  @UseInterceptors(WsContextInterceptor)
  @SubscribeMessage('subscribe_parcel_trip')
  async handleSubscribeParcelTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { trackingNumber: string },
  ): Promise<{ event: string; data: { tripId: string; tripNumber?: string } }> {
    const parcel = await this.customerShipmentFacade.getParcelTracking(
      payload.trackingNumber,
    );

    if (parcel.currentStatus !== ParcelStatus.IN_TRANSIT) {
      throw new WsException('Parcel is not currently in transit');
    }

    const lastLoaded = [...parcel.history]
      .reverse()
      .find((m: any) => m.actionType === ActionType.LOADED_ON_TRIP);

    if (!lastLoaded?.tripId) {
      throw new WsException('No active trip found for this parcel');
    }

    await client.join(`trip:${lastLoaded.tripId}`);

    this.logger.debug(
      `Client ${client.id} joined trip room trip:${lastLoaded.tripId}`,
    );

    return {
      event: 'subscribed',
      data: {
        tripId: lastLoaded.tripId,
        tripNumber: lastLoaded.tripNumber,
      },
    };
  }

  // ─── Driver Location ─────────────────────────────────────────────────────────

  /**
   * Receives GPS coordinates from the assigned driver.
   *
   * Authorization:
   *   1. WsContextInterceptor verifies JWT and populates the Principal.
   *   2. We assert Principal.subject.type === DRIVER.
   *   3. We fetch the trip via FleetFacade and assert:
   *      - trip.status === IN_PROGRESS
   *      - trip.driverId === principal.profileId  (assigned driver only)
   *
   * After authorization:
   *   - Entry is buffered in Redis (RPUSH trip:locations:{tripId}).
   *   - Live location is broadcast to all trip room subscribers immediately.
   */
  @UseInterceptors(WsContextInterceptor)
  @SubscribeMessage('driver_location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { tripId: string; latitude: number; longitude: number },
  ): Promise<void> {
    const principal = this.requestContextService.getPrincipal();

    if (principal.subject.type !== SubjectType.DRIVER) {
      throw new WsException('Only drivers can push location updates');
    }

    const tenantId = principal.tenantId;
    const driverId = principal.profileId;

    if (!tenantId || !driverId) {
      throw new WsException('Incomplete driver context');
    }

    await this.assertDriverOwnsActiveTrip(tenantId, driverId, payload.tripId);

    const recordedAt = new Date();
    const entry = {
      tripId: payload.tripId,
      driverId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      recordedAt,
    };

    // Buffer in Redis (flushed to DB every 2 min by LocationFlusherService)
    await this.locationFlusher.buffer(entry);

    // Ensure the driver is also in the trip room
    await client.join(`trip:${payload.tripId}`);

    // Broadcast live location to all trip subscribers immediately
    this.server.to(`trip:${payload.tripId}`).emit('driver_location', {
      driverId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      recordedAt: recordedAt.toISOString(),
    });
  }

  private async assertDriverOwnsActiveTrip(
    tenantId: string,
    driverId: string,
    tripId: string,
  ): Promise<void> {
    const cached = this.tripAuthCache.get(tripId);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      cached.driverId === driverId &&
      cached.tenantId === tenantId
    ) {
      return;
    }

    const trip = await this.fleetFacade.getTripDetails(tenantId, tripId);

    if (trip.status !== TripStatus.IN_PROGRESS) {
      this.tripAuthCache.delete(tripId);
      throw new WsException('Trip is not in progress');
    }

    if (trip.driverId !== driverId) {
      throw new WsException('You are not the assigned driver for this trip');
    }

    this.tripAuthCache.set(tripId, {
      driverId,
      tenantId,
      expiresAt: Date.now() + TrackingGateway.TRIP_AUTH_TTL_MS,
    });
  }

  // ─── Dashboard Subscriptions ──────────────────────────────────────────────────

  @UseInterceptors(WsContextInterceptor)
  @SubscribeMessage('subscribe_trip')
  async handleSubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; tenantId?: string },
  ): Promise<void> {
    const principal = this.requestContextService.getPrincipal();

    const visibleTrips = await this.fleetFacade.filterVisibleTrips(
      principal,
      [data.tripId],
      data.tenantId,
    );

    if (visibleTrips.length === 0) {
      client.emit('subscribe_error', {
        tripId: data.tripId,
        reason: 'FORBIDDEN',
      });
      return;
    }

    await client.join(`trip:${data.tripId}`);
    client.emit('subscribed', { tripId: data.tripId });
  }

  @UseInterceptors(WsContextInterceptor)
  @SubscribeMessage('subscribe_trips')
  async handleSubscribeTrips(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripIds: string[]; tenantId?: string },
  ): Promise<{ subscribed: string[]; rejected: string[] }> {
    const principal = this.requestContextService.getPrincipal();

    const visibleTripIds = await this.fleetFacade.filterVisibleTrips(
      principal,
      data.tripIds,
      data.tenantId,
    );

    const subscribed: string[] = [];
    const rejected: string[] = [];
    const visibleSet = new Set(visibleTripIds);

    for (const tripId of data.tripIds) {
      if (visibleSet.has(tripId)) {
        await client.join(`trip:${tripId}`);
        subscribed.push(tripId);
      } else {
        rejected.push(tripId);
      }
    }

    return { subscribed, rejected };
  }

  @SubscribeMessage('unsubscribe_trip')
  async handleUnsubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ): Promise<void> {
    await client.leave(`trip:${data.tripId}`);
  }

  @SubscribeMessage('unsubscribe_trips')
  async handleUnsubscribeTrips(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripIds: string[] },
  ): Promise<void> {
    for (const id of data.tripIds) {
      await client.leave(`trip:${id}`);
    }
  }

  // ─── Application-Level Heartbeat ──────────────────────────────────────────────

  /**
   * Called periodically by clients (e.g., every 10 seconds).
   * 1. WsContextInterceptor validates the JWT signature and expiration. If expired,
   *    it throws WsException before this runs.
   * 2. This handler re-evaluates visibility for all currently joined trip rooms
   *    to catch mid-session permission revocations (e.g., employee transferred).
   */
  @UseInterceptors(WsContextInterceptor)
  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId?: string } = {},
  ): Promise<void> {
    const principal = this.requestContextService.getPrincipal();

    const tripRooms = Array.from(client.rooms)
      .filter((r) => r.startsWith('trip:'))
      .map((r) => r.replace('trip:', ''));

    if (tripRooms.length === 0) {
      client.emit('pong', { valid: true });
      return;
    }

    const visibleTripIds = await this.fleetFacade.filterVisibleTrips(
      principal,
      tripRooms,
      data.tenantId,
    );

    const visibleSet = new Set(visibleTripIds);

    for (const tripId of tripRooms) {
      if (!visibleSet.has(tripId)) {
        await client.leave(`trip:${tripId}`);
      }
    }

    client.emit('pong', { valid: true });
  }

  // ─── Internal Events ─────────────────────────────────────────────────────────

  /**
   * Broadcasts a parcel movement to all clients subscribed to the trip room.
   * Triggered via EventEmitter2 from TrackingCommandService.
   */
  @OnEvent(PARCEL_MOVEMENT_APPENDED)
  handleMovementAppended(payload: ParcelMovementAppendedPayload): void {
    if (!payload.tripId) return;

    this.server
      .to(`trip:${payload.tripId}`)
      .emit('parcel_movement', payload.movement);

    this.logger.debug(
      `Emitted parcel_movement to room trip:${payload.tripId}`,
    );
  }
}
