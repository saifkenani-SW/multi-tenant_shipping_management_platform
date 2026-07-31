import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class TenantSubscription {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly planId: string,
    public status: SubscriptionStatus,
    public readonly startedAt: Date,
    public expiresAt: Date,
    public snapshotMaxBranches: number,
    public snapshotMaxWarehouses: number,
    public snapshotMaxEmployees: number,
    public snapshotMaxVehicles: number,
    public snapshotMaxZones: number,
    public snapshotMaxMonthlyShipments: number | null,
    public snapshotMaxMonthlyParcels: number | null,
    public snapshotFeatures: any,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public cancelledAt: Date | null,
    public cancellationReason: string | null,
  ) {}
}
