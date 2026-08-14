export const BILLING_CACHE_KEYS = {
  PREFIX: 'billing',
  INVOICE_LIST: 'billing:invoice:list',
  INVOICE_DETAILS: 'billing:invoice:details',
};

export const BILLING_CACHE_TTL = {
  LIST: 120,
  DETAILS: 120,
};

/**
 * Days between issuing an invoice and its due date.
 *
 * A constant for now. When payment terms need to differ per tenant, this
 * becomes a field on tenant settings and only this reference changes.
 */
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

/** Document marker in an invoice number, between the tenant prefix and the year. */
export const INVOICE_NUMBER_MARKER = 'INV';

/** Fallback when a tenant has not configured a prefix of its own. */
export const DEFAULT_INVOICE_PREFIX = 'SHP';

/** Width of the running number, zero padded: 00001. */
export const INVOICE_SEQUENCE_PAD = 5;
