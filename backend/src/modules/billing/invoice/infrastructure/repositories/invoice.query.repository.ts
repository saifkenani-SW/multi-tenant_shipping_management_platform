import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { PaymentStatus } from '@prisma/client';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import type { InvoiceMergedCriteria } from '../../application/dtos/requests/invoice-merged-criteria.interface';
import { Invoice } from '../../domain/entities/invoice.entity';

const INVOICE_COLUMNS = [
  'i.id',
  'i.version',
  'i.tenant_id',
  'i.customer_shipment_id',
  'i.sender_name',
  'i.sender_phone',
  'i.receiver_name',
  'i.receiver_phone',
  'i.origin_org_unit_id',
  'i.destination_org_unit_id',
  'i.invoice_number',
  'i.subtotal',
  'i.handling_fees',
  'i.tax_amount',
  'i.discount_amount',
  'i.total_amount',
  'i.payment_responsibility',
  'i.currency',
  'i.status',
  'i.due_date',
  'i.created_at',
  'i.updated_at',
] as const;

@Injectable()
export class InvoiceQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  /**
   * Sum of completed payments, as a correlated subquery.
   *
   * Only COMPLETED counts toward what was collected. Refunds are a separate
   * column so history can show both without erasing the original collections.
   */
  private paidAmountExpression(eb: any) {
    return eb
      .selectFrom('payment as pay')
      .select((inner: any) =>
        inner.fn.coalesce(inner.fn.sum('pay.amount'), inner.val(0)).as('paid'),
      )
      .whereRef('pay.invoice_id', '=', 'i.id')
      .where('pay.status', '=', PaymentStatus.COMPLETED)
      .as('paid_amount');
  }

  private refundedAmountExpression(eb: any) {
    return eb
      .selectFrom('payment as pay')
      .select((inner: any) =>
        inner.fn
          .coalesce(inner.fn.sum('pay.amount'), inner.val(0))
          .as('refunded'),
      )
      .whereRef('pay.invoice_id', '=', 'i.id')
      .where('pay.status', '=', PaymentStatus.REFUNDED)
      .as('refunded_amount');
  }

  async findMany(
    criteria: InvoiceMergedCriteria,
  ): Promise<CursorPaginatedResponse<any>> {
    let query: any = this.kysely
      .selectFrom('invoice as i')
      .select([...INVOICE_COLUMNS])
      .select((eb: any) => this.paidAmountExpression(eb))
      .select((eb: any) => this.refundedAmountExpression(eb));

    if (criteria.tenantId) {
      query = query.where('i.tenant_id', '=', criteria.tenantId);
    }

    if (criteria.status) {
      query = query.where('i.status', '=', criteria.status);
    }

    // Invoices carry contact details, not a customer account, so the caller
    // searches by phone rather than by profile id.
    if (criteria.senderPhone) {
      query = query.where('i.sender_phone', '=', criteria.senderPhone);
    }

    if (criteria.customerShipmentId) {
      query = query.where(
        'i.customer_shipment_id',
        '=',
        criteria.customerShipmentId,
      );
    }

    if (criteria.paymentResponsibility) {
      query = query.where(
        'i.payment_responsibility',
        '=',
        criteria.paymentResponsibility,
      );
    }

    // Either end of the route counts: the branch that sent it and the branch
    // that hands it over both deal with this invoice.
    if (criteria.orgUnitId) {
      query = query.where((eb: any) =>
        eb.or([
          eb('i.origin_org_unit_id', '=', criteria.orgUnitId!),
          eb('i.destination_org_unit_id', '=', criteria.orgUnitId!),
        ]),
      );
    }

    // An empty assignment list must match nothing rather than everything.
    if (criteria.scopedOrgUnitIds) {
      query = criteria.scopedOrgUnitIds.length
        ? query.where((eb: any) =>
            eb.or([
              eb('i.origin_org_unit_id', 'in', criteria.scopedOrgUnitIds!),
              eb('i.destination_org_unit_id', 'in', criteria.scopedOrgUnitIds!),
            ]),
          )
        : query.where((eb: any) => eb.val(false));
    }

    if (criteria.issuedFrom) {
      query = query.where('i.created_at', '>=', criteria.issuedFrom);
    }

    if (criteria.issuedTo) {
      query = query.where('i.created_at', '<=', criteria.issuedTo);
    }

    if (criteria.dueBefore) {
      query = query.where('i.due_date', '<=', criteria.dueBefore);
    }

    if (criteria.cursor) {
      query = query.where('i.id', '<', criteria.cursor);
    }

    const limit = criteria.limit || 20;
    query = query.orderBy('i.id', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      records.length > 0 ? records[records.length - 1].id : null;

    return new CursorPaginatedResponse<any>(records, {
      hasNextPage,
      hasPreviousPage: !!criteria.cursor,
      nextCursor,
      previousCursor: null,
    });
  }

  async findRawById(id: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('invoice as i')
      .select([...INVOICE_COLUMNS])
      .select((eb: any) => this.paidAmountExpression(eb))
      .select((eb: any) => this.refundedAmountExpression(eb))
      .where('i.id', '=', id)
      .executeTakeFirst();

    return record ?? null;
  }

  async findRawByShipmentId(customerShipmentId: string): Promise<any | null> {
    const record = await this.kysely
      .selectFrom('invoice as i')
      .select([...INVOICE_COLUMNS])
      .select((eb: any) => this.paidAmountExpression(eb))
      .select((eb: any) => this.refundedAmountExpression(eb))
      .where('i.customer_shipment_id', '=', customerShipmentId)
      .executeTakeFirst();

    return record ?? null;
  }

  /** Every payment and refund recorded against an invoice, oldest first. */
  async findPayments(invoiceId: string): Promise<any[]> {
    return this.kysely
      .selectFrom('payment')
      .select([
        'id',
        'amount',
        'payment_method',
        'status',
        'collected_by_employee_id',
        'organization_unit_id',
        'transaction_reference',
        'created_at',
      ])
      .where('invoice_id', '=', invoiceId)
      .orderBy('created_at', 'asc')
      .execute();
  }

  /** What an invoice has actually collected, used before deciding its status. */
  async sumCompletedPayments(invoiceId: string): Promise<number> {
    const row = await this.kysely
      .selectFrom('payment')
      .select((eb) => eb.fn.coalesce(eb.fn.sum('amount'), eb.val(0)).as('paid'))
      .where('invoice_id', '=', invoiceId)
      .where('status', '=', PaymentStatus.COMPLETED)
      .executeTakeFirst();

    return Number(row?.paid ?? 0);
  }

  /**
   * Loads the aggregate so a caller can ask it to decide a transition.
   * Carries `version` for the optimistic-locking write that follows.
   */
  async findAggregateById(id: string): Promise<Invoice | null> {
    const record = await this.findRawById(id);
    if (!record) return null;

    return this.toAggregate(record);
  }

  async findAggregateByShipmentId(
    customerShipmentId: string,
  ): Promise<Invoice | null> {
    const record = await this.findRawByShipmentId(customerShipmentId);
    if (!record) return null;

    return this.toAggregate(record);
  }

  private toAggregate(record: any): Invoice {
    return Invoice.restore({
      id: record.id,
      version: record.version,
      tenantId: record.tenant_id,
      customerShipmentId: record.customer_shipment_id,
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      invoiceNumber: record.invoice_number,
      subtotal: Number(record.subtotal),
      handlingFees: Number(record.handling_fees),
      taxAmount: Number(record.tax_amount),
      discountAmount: Number(record.discount_amount),
      totalAmount: Number(record.total_amount),
      paymentResponsibility: record.payment_responsibility,
      currency: record.currency,
      status: record.status,
      dueDate: record.due_date,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }
}
