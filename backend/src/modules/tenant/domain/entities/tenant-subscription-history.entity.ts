export class TenantSubscriptionHistory {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly subscriptionId: string,
    public readonly planId: string,
    public readonly action: string,
    public readonly performedAt: Date,
    public readonly previousPlanId: string | null,
    public readonly notes: string | null,
    public readonly performedBy: string | null,
  ) {}
}
