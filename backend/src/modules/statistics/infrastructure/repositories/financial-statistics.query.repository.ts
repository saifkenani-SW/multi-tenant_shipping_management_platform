import { Inject, Injectable } from '@nestjs/common';
import { Currency, InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Kysely, sql } from 'kysely';

import { DB } from '../../../../infrastructure/database/generated/kysely/types';

export type BreakdownDimension = 'TENANT' | 'ORG_UNIT' | 'NONE';

export interface FinancialScope {
  /** Null only for a platform owner looking across every workspace. */
  tenantId: string | null;

  /**
   * Branches the caller may see. Null means no branch restriction; an empty
   * array means the caller can see nothing, which is not the same thing.
   */
  orgUnitIds: string[] | null;

  from: Date;
  to: Date;
  breakdownBy: BreakdownDimension;
}

export interface MoneyRow {
  currency: Currency;
  invoiced: number;
  collected: number;
  overdue_amount: number;
  overdue_count: number;
  invoice_count: number;
}

export interface StatusRow {
  status: InvoiceStatus;
  currency: Currency;
  count: number;
  amount: number;
}

export interface BreakdownRow {
  id: string;
  name: string | null;
  currency: Currency;
  invoiced: number;
  collected: number;
  invoice_count: number;
}

@Injectable()
export class FinancialStatisticsQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: Kysely<DB>,
  ) {}

  /**
   * Every figure is grouped by currency and never summed across them. The
   * schema allows SY and USD and billing enforces a different minimum payment
   * for each, so one combined total would be a number with no meaning.
   *
   * `collected` comes from the payments themselves rather than from the
   * invoice status, because an invoice can be part paid: counting only
   * settled invoices would under-report money already in the till. Only
   * COMPLETED payments count — a failed or refunded one was never collected.
   */
  async money(scope: FinancialScope): Promise<MoneyRow[]> {
    const rows = await this.db
      .selectFrom('invoice as i')
      .leftJoin(this.paidPerInvoice(), (join) =>
        join.onRef('paid.invoice_id', '=', 'i.id'),
      )
      .select(({ fn }) => [
        'i.currency as currency',
        fn.sum<number>('i.total_amount').as('invoiced'),
        sql<number>`COALESCE(SUM(paid.amount), 0)`.as('collected'),
        sql<number>`COALESCE(SUM(CASE WHEN i.status = ${sql.lit(
          InvoiceStatus.OVERDUE,
        )}::"InvoiceStatus" THEN i.total_amount - COALESCE(paid.amount, 0) ELSE 0 END), 0)`.as(
          'overdue_amount',
        ),
        sql<number>`COUNT(*) FILTER (WHERE i.status = ${sql.lit(
          InvoiceStatus.OVERDUE,
        )}::"InvoiceStatus")`.as('overdue_count'),
        fn.count<number>('i.id').as('invoice_count'),
      ])
      .where(this.scopeFilter(scope))
      .groupBy('i.currency')
      .execute();

    return rows as unknown as MoneyRow[];
  }

  async byStatus(scope: FinancialScope): Promise<StatusRow[]> {
    const rows = await this.db
      .selectFrom('invoice as i')
      .select(({ fn }) => [
        'i.status as status',
        'i.currency as currency',
        fn.count<number>('i.id').as('count'),
        fn.sum<number>('i.total_amount').as('amount'),
      ])
      .where(this.scopeFilter(scope))
      .groupBy(['i.status', 'i.currency'])
      .execute();

    return rows as unknown as StatusRow[];
  }

  /**
   * Grouped by workspace for a platform owner, and by the originating branch
   * for everyone else — origin rather than destination, because that is the
   * branch that took the shipment in and raised the invoice.
   */
  async breakdown(scope: FinancialScope): Promise<BreakdownRow[]> {
    if (scope.breakdownBy === 'NONE') {
      return [];
    }

    const byTenant = scope.breakdownBy === 'TENANT';

    const rows = await this.db
      .selectFrom('invoice as i')
      .leftJoin(this.paidPerInvoice(), (join) =>
        join.onRef('paid.invoice_id', '=', 'i.id'),
      )
      .leftJoin('tenant as t', 't.id', 'i.tenant_id')
      .leftJoin('organization_unit as ou', 'ou.id', 'i.origin_org_unit_id')
      .select(({ fn }) => [
        byTenant
          ? sql<string>`i.tenant_id`.as('id')
          : sql<string>`i.origin_org_unit_id`.as('id'),
        byTenant
          ? sql<string | null>`t.name`.as('name')
          : sql<string | null>`ou.name`.as('name'),
        'i.currency as currency',
        fn.sum<number>('i.total_amount').as('invoiced'),
        sql<number>`COALESCE(SUM(paid.amount), 0)`.as('collected'),
        fn.count<number>('i.id').as('invoice_count'),
      ])
      .where(this.scopeFilter(scope))
      .groupBy(
        byTenant
          ? [sql`i.tenant_id`, sql`t.name`, sql`i.currency`]
          : [sql`i.origin_org_unit_id`, sql`ou.name`, sql`i.currency`],
      )
      .orderBy(sql`SUM(i.total_amount)`, 'desc')
      .execute();

    return (rows as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id ?? ''),
      name: (row.name as string | null) ?? null,
      currency: row.currency as Currency,
      invoiced: Number(row.invoiced ?? 0),
      collected: Number(row.collected ?? 0),
      invoice_count: Number(row.invoice_count ?? 0),
    }));
  }

  /** Money actually taken per invoice, counting settled payments only. */
  private paidPerInvoice() {
    return this.db
      .selectFrom('payment')
      .select(({ fn }) => ['invoice_id', fn.sum<number>('amount').as('amount')])
      .where('status', '=', PaymentStatus.COMPLETED)
      .groupBy('invoice_id')
      .as('paid');
  }

  /**
   * The visibility boundary, applied identically to every query here so no
   * figure is ever computed over rows the caller may not see.
   */
  private scopeFilter(scope: FinancialScope) {
    const conditions = [
      sql<boolean>`i.created_at >= ${scope.from}`,
      sql<boolean>`i.created_at <= ${scope.to}`,
    ];

    if (scope.tenantId) {
      conditions.push(sql<boolean>`i.tenant_id = ${scope.tenantId}::uuid`);
    }

    if (scope.orgUnitIds) {
      // An empty list means the caller is scoped to no branch at all. Dropping
      // the filter would show them everything, so match nothing instead.
      conditions.push(
        scope.orgUnitIds.length === 0
          ? sql<boolean>`FALSE`
          : sql<boolean>`(i.origin_org_unit_id = ANY(${scope.orgUnitIds}::uuid[])
              OR i.destination_org_unit_id = ANY(${scope.orgUnitIds}::uuid[]))`,
      );
    }

    return conditions.reduce(
      (all, one) => sql<boolean>`${all} AND ${one}`,
    ) as never;
  }
}
