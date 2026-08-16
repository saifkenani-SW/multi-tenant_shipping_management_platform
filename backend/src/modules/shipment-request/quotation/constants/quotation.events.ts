export const QUOTATION_EVENTS = {
  MANUAL_PRICE_REQUESTED: 'quotation.manual_price_requested',
  MANUAL_PRICE_SUBMITTED: 'quotation.manual_price_submitted',
};

export interface QuotationManualPriceRequestedPayload {
  quotationId: string;
  shipmentRequestId: string;
  originOrgUnitId: string;
}

export interface QuotationManualPriceSubmittedPayload {
  quotationId: string;
  shipmentRequestId: string;
}
