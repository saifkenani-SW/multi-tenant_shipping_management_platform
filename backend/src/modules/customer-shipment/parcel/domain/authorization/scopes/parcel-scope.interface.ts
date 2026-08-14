export interface ParcelScopeInterface {
  parcel?: {
    tenant_id?: string;
    org_unit_ids?: string[];
  };

  shipment?: {
    sender_phone?: string;
    receiver_phone?: string;
  };
}
