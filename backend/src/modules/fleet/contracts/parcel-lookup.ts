/**
 * What Fleet needs to know about a parcel, and nothing more.
 *
 * The contract lives here rather than in Customer Shipment because Fleet is
 * the consumer: it states its own need, and the providing module implements
 * it. Depending on the facade class directly would also drag that module's
 * whole import graph into every Fleet unit test.
 */
export interface ParcelSummary {
  id: string;
  trackingNumber: string;
  description?: string | null;
  actualWeightKg: number;
  isFragile: boolean;
  destinationOrgUnitId?: string | null;
}

export interface ParcelLookup {
  getParcelsByIds(parcelIds: string[]): Promise<ParcelSummary[]>;
}

export const PARCEL_LOOKUP = Symbol('FLEET_PARCEL_LOOKUP');
