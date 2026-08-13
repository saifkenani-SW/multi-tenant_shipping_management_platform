export interface PodScopeInterface {
  pod?: {
    tenant_id?: string;
  };

  shipment?: {
    sender_phone?: string;
    receiver_phone?: string;
  };
}
