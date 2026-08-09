/** Payload accepted by every shipment authorization strategy. */
export interface ShipmentActionPayload {
  /** Required by View, Update and Cancel — absent when creating. */
  shipmentId?: string;
  /** Supplied on Create so the ability can check tenant ownership. */
  tenantId?: string;
}
