export class TenantOperationalSettings {
  constructor(
    public readonly tenantId: string,
    public readonly trackingPrefix: string | null = null,
    public readonly autoCloseShipmentAfterCollection: boolean = true,
    public readonly allowShipmentReopen: boolean = false,
    public readonly allowTripCancellationAfterLoading: boolean = false,
    public readonly requireManagerBeforeTripDeparture: boolean = false,
    public readonly allowReturnAfterCollection: boolean = false,
    public readonly quotationValidityHours: number = 48,
  ) {}
}
