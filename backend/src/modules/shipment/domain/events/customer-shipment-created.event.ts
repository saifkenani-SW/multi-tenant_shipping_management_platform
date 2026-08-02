export class CustomerShipmentCreatedEvent {
  public static readonly EVENT_NAME = 'shipment.customer_shipment.created';

  constructor(
    public readonly shipmentId: string,
    public readonly tenantId: string,
    public readonly shipmentRequestId?: string | null,
  ) {}
}
