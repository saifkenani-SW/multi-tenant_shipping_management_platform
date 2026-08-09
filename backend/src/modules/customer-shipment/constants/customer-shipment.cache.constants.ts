export const CUSTOMER_SHIPMENT_CACHE_KEYS = {
  PREFIX: 'customer-shipment',
  LIST: 'customer-shipment:list',
  DETAILS: 'customer-shipment:details',
  PARCEL_LIST: 'customer-shipment:parcel:list',
  PARCEL_DETAILS: 'customer-shipment:parcel:details',
  POD_DETAILS: 'customer-shipment:pod:details',
};

export const CUSTOMER_SHIPMENT_CACHE_TTL = {
  LIST: 300,
  DETAILS: 300,
};

/** Storage category under which generated parcel labels are saved. */
export const PARCEL_LABEL_STORAGE_CATEGORY = 'parcel-labels';
