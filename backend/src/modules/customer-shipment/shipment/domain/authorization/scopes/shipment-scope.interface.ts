export interface ShipmentScopeInterface {
  shipment?: {
    tenant_id?: string;
    customer_phone?: string;
    org_unit_ids?: string[];
  };

  parcel?: {
    tenant_id?: string;
    destination_org_unit_ids?: string[];
  };
}
