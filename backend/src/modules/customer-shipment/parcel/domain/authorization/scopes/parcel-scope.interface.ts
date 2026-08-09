export interface ParcelScopeInterface {
  parcel?: {
    tenant_id?: string;
    destination_org_unit_ids?: string[];
  };

  shipment?: {
    sender_customer_profile_id?: string;
  };
}
