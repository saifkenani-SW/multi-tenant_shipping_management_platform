import { Currency } from '@prisma/client';

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

export const DEFAULT_CURRENCY = Currency.SY;

/** Least amount accepted for a payment, unless the remaining balance is smaller. */
export const MIN_PAYMENT_AMOUNT: Record<Currency, number> = {
  [Currency.SY]: 1000,
  [Currency.USD]: 100,
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Maps tenant settings and legacy codes (SYP, SR, SAR) onto the two currencies we bill in. */
export function resolveCurrency(raw: unknown): Currency {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase();

  if (value === Currency.USD || value === 'US') {
    return Currency.USD;
  }

  return Currency.SY;
}

export function minimumPaymentAmount(currency: Currency): number {
  return MIN_PAYMENT_AMOUNT[currency];
}
