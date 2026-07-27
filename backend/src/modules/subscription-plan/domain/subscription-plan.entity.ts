export class SubscriptionPlan {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly maxBranches: number,
    public readonly maxWarehouses: number,
    public readonly maxEmployees: number,
    public readonly maxVehicles: number,
    public readonly maxZones: number,
    public readonly maxMonthlyShipments: number | null,
    public readonly maxMonthlyParcels: number | null,
    public readonly priceMonthly: number,
    public readonly priceYearly: number | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
