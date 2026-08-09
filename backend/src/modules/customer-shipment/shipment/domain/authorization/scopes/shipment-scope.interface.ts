export interface ShipmentScopeInterface {
  shipment?: {
    tenant_id?: string;
    sender_customer_profile_id?: string;
    origin_org_unit_ids?: string[];
  };

  parcel?: {
    tenant_id?: string;
    destination_org_unit_ids?: string[];
  };
}
