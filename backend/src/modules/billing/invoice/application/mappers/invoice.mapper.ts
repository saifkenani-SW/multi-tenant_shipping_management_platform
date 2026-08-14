import { Injectable } from '@nestjs/common';
import { InvoiceResponseDto } from '../dtos/responses/invoice.response.dto';
import {
  InvoiceDetailsResponseDto,
  InvoicePaymentDto,
} from '../dtos/responses/invoice-details.response.dto';

/** Maps raw Kysely rows (snake_case) to the API shape (camelCase). */
@Injectable()
export class InvoiceMapper {
  toResponse(record: any): InvoiceResponseDto {
    const totalAmount = Number(record.total_amount);
    const paidAmount = Number(record.paid_amount ?? 0);

    return {
      id: record.id,
      tenantId: record.tenant_id,
      invoiceNumber: record.invoice_number,
      customerShipmentId: record.customer_shipment_id ?? null,
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      subtotal: Number(record.subtotal),
      handlingFees: Number(record.handling_fees),
      taxAmount: Number(record.tax_amount),
      discountAmount: Number(record.discount_amount),
      totalAmount,
      paidAmount,
      // Never negative: an overpayment is still a settled invoice, and the
      // surplus is a refund question rather than a negative balance.
      balanceDue: Math.max(
        0,
        Math.round((totalAmount - paidAmount) * 100) / 100,
      ),
      paymentResponsibility: record.payment_responsibility,
      currency: (record.currency ?? '').trim(),
      status: record.status,
      dueDate: record.due_date ?? null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  toPaymentDto(record: any): InvoicePaymentDto {
    return {
      id: record.id,
      amount: Number(record.amount),
      paymentMethod: record.payment_method,
      status: record.status,
      collectedByEmployeeId: record.collected_by_employee_id ?? null,
      organizationUnitId: record.organization_unit_id ?? null,
      transactionReference: record.transaction_reference ?? null,
      createdAt: record.created_at,
    };
  }

  toDetails(record: any, payments: any[]): InvoiceDetailsResponseDto {
    return {
      ...this.toResponse(record),
      payments: payments.map((p) => this.toPaymentDto(p)),
    };
  }
}
