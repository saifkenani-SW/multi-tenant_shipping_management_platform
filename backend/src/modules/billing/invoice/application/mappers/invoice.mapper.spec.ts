import {
  Currency,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { InvoiceMapper } from './invoice.mapper';

describe('InvoiceMapper', () => {
  const mapper = new InvoiceMapper();

  const invoiceRow = {
    id: 'inv-1',
    tenant_id: 'tenant-1',
    invoice_number: 'DAM-INV-2026-00001',
    customer_shipment_id: 'ship-1',
    sender_name: 'Sender',
    sender_phone: '+963900000000',
    receiver_name: 'Receiver',
    receiver_phone: '+963911111111',
    origin_org_unit_id: 'origin-1',
    destination_org_unit_id: 'dest-1',
    subtotal: 5000,
    handling_fees: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 5000,
    payment_responsibility: 'SENDER',
    currency: Currency.SY,
    status: InvoiceStatus.CANCELLED,
    due_date: null,
    created_at: new Date('2026-08-01T10:00:00.000Z'),
    updated_at: new Date('2026-08-01T12:00:00.000Z'),
  };

  it('keeps completed collections and refunds as separate totals after a pending cancel', () => {
    const details = mapper.toDetails(invoiceRow, [
      {
        id: 'pay-1',
        amount: 2000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        collected_by_employee_id: 'emp-1',
        organization_unit_id: 'origin-1',
        transaction_reference: null,
        created_at: new Date('2026-08-01T10:05:00.000Z'),
      },
      {
        id: 'pay-2',
        amount: 3000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        collected_by_employee_id: 'emp-1',
        organization_unit_id: 'origin-1',
        transaction_reference: null,
        created_at: new Date('2026-08-01T10:10:00.000Z'),
      },
      {
        id: 'refund-1',
        amount: 5000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.REFUNDED,
        collected_by_employee_id: null,
        organization_unit_id: null,
        transaction_reference: 'REFUND:DAM-INV-2026-00001',
        created_at: new Date('2026-08-01T12:00:00.000Z'),
      },
    ]);

    expect(details.paidAmount).toBe(5000);
    expect(details.refundedAmount).toBe(5000);
    expect(details.balanceDue).toBe(0);
    expect(details.status).toBe(InvoiceStatus.CANCELLED);
    expect(details.payments).toHaveLength(3);
    expect(details.payments.map((p) => p.status)).toEqual([
      PaymentStatus.COMPLETED,
      PaymentStatus.COMPLETED,
      PaymentStatus.REFUNDED,
    ]);
  });

  it('reports remaining balance on an open invoice from completed payments only', () => {
    const details = mapper.toDetails(
      { ...invoiceRow, status: InvoiceStatus.PARTIALLY_PAID },
      [
        {
          id: 'pay-1',
          amount: 1000,
          payment_method: PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          collected_by_employee_id: 'emp-1',
          organization_unit_id: 'origin-1',
          transaction_reference: null,
          created_at: new Date('2026-08-01T10:05:00.000Z'),
        },
      ],
    );

    expect(details.paidAmount).toBe(1000);
    expect(details.refundedAmount).toBe(0);
    expect(details.balanceDue).toBe(4000);
  });
});
