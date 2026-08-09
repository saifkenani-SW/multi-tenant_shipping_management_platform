/**
 * Domain events emitted by the Customer Shipment module.
 *
 * All are emitted inside the @Transactional() scope of the operation that
 * caused them, so a listener never observes an event whose transaction later
 * rolled back. The Billing module is the intended consumer.
 */
export const CUSTOMER_SHIPMENT_EVENTS = {
  CREATED: 'customer_shipment.created',
  CANCELLED: 'customer_shipment.cancelled',
  RETURNED: 'customer_shipment.returned',
  DELIVERED: 'customer_shipment.delivered',
} as const;

export interface CustomerShipmentCreatedPayload {
  shipmentId: string;
  tenantId: string;
  totalAmount: number | null;
  paymentResponsibility: string;
  currency: string | null;
}

export interface CustomerShipmentLifecyclePayload {
  shipmentId: string;
  tenantId: string;
}
