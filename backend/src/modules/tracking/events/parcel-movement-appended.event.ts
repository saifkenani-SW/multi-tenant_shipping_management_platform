/**
 * Emitted by TrackingCommandService after every successful parcel movement
 * append. TrackingGateway listens to this event to push real-time updates
 * to all WebSocket clients subscribed to the trip's room.
 */
export const PARCEL_MOVEMENT_APPENDED = 'parcel_movement.appended';

export interface ParcelMovementAppendedPayload {
  readonly tripId?: string;
  readonly movement: Record<string, unknown>;
}
