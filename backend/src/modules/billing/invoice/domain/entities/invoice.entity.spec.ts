import { ConflictException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { Invoice } from './invoice.entity';

const invoiceAt = (status: InvoiceStatus, totalAmount = 100) =>
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
    currency: 'SYP',
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
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 100);

      expect(invoice.applyPaidTotal(100)).toBe(InvoiceStatus.PAID);
      expect(invoice.status).toBe(InvoiceStatus.PAID);
    });

    it('settles on an overpayment rather than leaving it short', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 100);

      expect(invoice.applyPaidTotal(120)).toBe(InvoiceStatus.PAID);
    });

    it('marks a part payment as partially paid', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 100);

      expect(invoice.applyPaidTotal(40)).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('reports no change when the status already matches', () => {
      const invoice = invoiceAt(InvoiceStatus.PARTIALLY_PAID, 100);

      expect(invoice.applyPaidTotal(40)).toBeNull();
      expect(invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('settles an overdue invoice that gets paid', () => {
      const invoice = invoiceAt(InvoiceStatus.OVERDUE, 100);

      expect(invoice.applyPaidTotal(100)).toBe(InvoiceStatus.PAID);
    });

    it('keeps an overdue invoice overdue while nothing is collected', () => {
      const invoice = invoiceAt(InvoiceStatus.OVERDUE, 100);

      expect(invoice.applyPaidTotal(0)).toBeNull();
      expect(invoice.status).toBe(InvoiceStatus.OVERDUE);
    });

    it('does not read a payment that exactly settles as short', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID, 0.1 + 0.2);

      expect(invoice.applyPaidTotal(0.3)).toBe(InvoiceStatus.PAID);
    });
  });

  describe('cancel', () => {
    it('cancels an unpaid invoice', () => {
      const invoice = invoiceAt(InvoiceStatus.UNPAID);

      invoice.cancel();

      expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('refuses to cancel a paid invoice', () => {
      const invoice = invoiceAt(InvoiceStatus.PAID);

      expect(() => invoice.cancel()).toThrow(ConflictException);
    });
  });

  describe('assertAcceptsPayment', () => {
    it('accepts payment on an unpaid invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.UNPAID).assertAcceptsPayment(),
      ).not.toThrow();
    });

    it('accepts payment on an overdue invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.OVERDUE).assertAcceptsPayment(),
      ).not.toThrow();
    });

    it('refuses payment on a settled invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.PAID).assertAcceptsPayment(),
      ).toThrow(ConflictException);
    });

    it('refuses payment on a cancelled invoice', () => {
      expect(() =>
        invoiceAt(InvoiceStatus.CANCELLED).assertAcceptsPayment(),
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
