export interface ShipmentRequestScopeInterface {
  request?: {
    customer_profile_id?: string;
    target_tenant_id?: string;
  };

  quotation?: {
    tenant_id?: string;
    origin_org_unit_ids?: string[];
  };
}
