import { ConflictException } from '@nestjs/common';
import { Currency, InvoiceStatus } from '@prisma/client';
import { Invoice } from './invoice.entity';

const invoiceAt = (
  status: InvoiceStatus,
  totalAmount = 5000,
  currency: Currency = Currency.SY,
) =>
  Invoice.restore({
    id: '01910b80-6e42-7000-8000-000000000901',
    version: 1,
    tenantId: '01910b80-6e42-7000-8000-000000000000',
    senderName: 'Sender',
    senderPhone: '+963900000000',
    receiverName: 'Receiver',
    receiverPhone: '+963911111111',
    customerShipmentId: '01910b80-6e42-7000-8000-000000000001',
    originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
    destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
    invoiceNumber: 'DAM-INV-2026-00001',
    subtotal: totalAmount,
    handlingFees: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount,
    paymentResponsibility: 'SENDER',
    currency,
    status,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('Invoice', () => {
  describe('calculateTotal', () => {
    it('adds fees and tax, then subtracts the discount', () => {
      expect(
        Invoice.calculateTotal({
          subtotal: 35,
          handlingFees: 5,
          taxAmount: 5.25,
          discountAmount: 2,
        }),
      ).toBe(43.25);
    });

    it('rounds to two decimals', () => {
      expect(
        Invoice.calculateTotal({
          subtotal: 10.005,
          handlingFees: 0,
          taxAmount: 0,
          discountAmount: 0,
        }),
      ).toBe(10.01);
    });

    it('refuses a discount larger than the charge', () => {
      expect(() =>
        Invoice.calculateTotal({
          subtotal: 10,
          handlingFees: 0,
          taxAmount: 0,
          discountAmount: 50,
        }),
      ).toThrow(ConflictException);
    });
  });

  describe('applyPaidTotal', () => {
    it('settles the invoice once the full amount is collected', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 5000);

      expect(invoice.applyPaidTotal(5000)).toBe(InvoiceStatus.PAID);
      expect(invoice.status).toBe(InvoiceStatus.PAID);
    });

    it('refuses an overpayment rather than marking it paid', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 5000);

      expect(() => invoice.applyPaidTotal(5200)).toThrow(ConflictException);
    });

    it('marks a part payment as partially paid', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 5000);

      expect(invoice.applyPaidTotal(1000)).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('reports no change when the status already matches', () => {
      const invoice = invoiceAt(InvoiceStatus.PARTIALLY_PAID, 5000);

      expect(invoice.applyPaidTotal(2000)).toBeNull();
      expect(invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('settles an overdue invoice that gets paid', () => {
      const invoice = invoiceAt(InvoiceStatus.OVERDUE, 5000);

      expect(invoice.applyPaidTotal(5000)).toBe(InvoiceStatus.PAID);
    });

    it('keeps an overdue invoice overdue while nothing is collected', () => {
      const invoice = invoiceAt(InvoiceStatus.OVERDUE, 5000);

      expect(invoice.applyPaidTotal(0)).toBeNull();
      expect(invoice.status).toBe(InvoiceStatus.OVERDUE);
    });

    it('does not read a payment that exactly settles as short', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 0.3, Currency.USD);

      expect(invoice.applyPaidTotal(0.3)).toBe(InvoiceStatus.PAID);
    });
  });

  describe('cancel', () => {
    it('cancels an unpaid invoice', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID);

      invoice.cancel(0);

      expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('refuses to cancel a paid invoice', () => {
      const invoice = invoiceAt(InvoiceStatus.PAID);

      expect(() => invoice.cancel(5000)).toThrow(ConflictException);
    });

    it('refuses to cancel when any payment has already been taken', () => {
      const invoice = invoiceAt(InvoiceStatus.PARTIALLY_PAID);

      expect(() => invoice.cancel(1000)).toThrow(ConflictException);
    });

    it('refuses to cancel an overdue invoice that already has payments', () => {
      const invoice = invoiceAt(InvoiceStatus.OVERDUE);

      expect(() => invoice.cancel(1000)).toThrow(ConflictException);
    });
  });

  describe('cancelAfterRefund', () => {
    it('cancels a paid invoice once the money has been refunded', () => {
      const invoice = invoiceAt(InvoiceStatus.PAID);

      invoice.cancelAfterRefund();

      expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('cancels a partially paid invoice once the money has been refunded', () => {
      const invoice = invoiceAt(InvoiceStatus.PARTIALLY_PAID);

      invoice.cancelAfterRefund();

      expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
    });
  });

  describe('assertAcceptsPayment', () => {
    it('accepts a payment that meets the SY minimum', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID).assertAcceptsPayment(1000, 0),
      ).not.toThrow();
    });

    it('accepts a payment that meets the USD minimum', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID, 500, Currency.USD).assertAcceptsPayment(
          100,
          0,
        ),
      ).not.toThrow();
    });

    it('accepts payment on an overdue invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.OVERDUE).assertAcceptsPayment(1000, 0),
      ).not.toThrow();
    });

    it('refuses a payment below the SY minimum while enough remains', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID).assertAcceptsPayment(999, 0),
      ).toThrow(ConflictException);
    });

    it('refuses a payment below the USD minimum while enough remains', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID, 500, Currency.USD).assertAcceptsPayment(
          99,
          0,
        ),
      ).toThrow(ConflictException);
    });

    it('accepts the remaining balance when it is below the minimum', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID, 500).assertAcceptsPayment(500, 0),
      ).not.toThrow();
    });

    it('refuses a short payment when the remaining balance is below the minimum', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID, 500).assertAcceptsPayment(400, 0),
      ).toThrow(ConflictException);
    });

    it('refuses a payment larger than the remaining balance', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID).assertAcceptsPayment(1000, 4500),
      ).toThrow(ConflictException);
    });

    it('refuses payment on a settled invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.PAID).assertAcceptsPayment(1000, 5000),
      ).toThrow(ConflictException);
    });

    it('refuses payment on a cancelled invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.CANCELLED).assertAcceptsPayment(1000, 0),
      ).toThrow(ConflictException);
    });
  });

  describe('markOverdue', () => {
    it('marks an unpaid invoice overdue', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID);

      invoice.markOverdue();

      expect(invoice.status).toBe(InvoiceStatus.OVERDUE);
    });

    it('never marks a settled invoice overdue', () => {
      expect(() => invoiceAt(InvoiceStatus.PAID).markOverdue()).toThrow(
        ConflictException,
      );
    });
  });
});
