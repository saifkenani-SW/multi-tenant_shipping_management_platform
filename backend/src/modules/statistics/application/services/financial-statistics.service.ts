import { ForbiddenException, Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';

import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import {
  BreakdownDimension,
  FinancialScope,
  FinancialStatisticsQueryRepository,
} from '../../infrastructure/repositories/financial-statistics.query.repository';
import { DashboardQueryDto } from '../dtos/requests/dashboard-query.dto';
import {
  DashboardScope,
  FinancialDashboardResponseDto,
  MoneyTotalsDto,
} from '../dtos/responses/financial-dashboard.response.dto';

@Injectable()
export class FinancialStatisticsService {
  constructor(
    private readonly repository: FinancialStatisticsQueryRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * One dashboard, read differently by each caller.
   *
   * The response shape never changes; `scope` says how to read it. Everything
   * that decides what the caller may see comes from the request context, never
   * from the request, so no figure can be computed over rows outside their
   * reach.
   */
  async getFinancialDashboard(
    query: DashboardQueryDto,
  ): Promise<FinancialDashboardResponseDto> {
    const { scope, dashboardScope } = this.resolveScope(query);

    // A driver has no financial view at all. Returning the same shape with
    // nothing in it keeps the frontend on one code path instead of handling a
    // 403 as a normal case.
    if (dashboardScope === DashboardScope.DRIVER) {
      return {
        scope: dashboardScope,
        range: { from: scope.from, to: scope.to },
        money: [],
        byStatus: [],
      };
    }

    const [money, byStatus, breakdown] = await Promise.all([
      this.repository.money(scope),
      this.repository.byStatus(scope),
      this.repository.breakdown(scope),
    ]);

    return {
      scope: dashboardScope,
      range: { from: scope.from, to: scope.to },
      money: money.map((row) => this.toMoneyTotals(row)),
      byStatus: byStatus.map((row) => ({
        status: row.status,
        currency: row.currency,
        count: Number(row.count),
        amount: Number(row.amount),
      })),
      breakdown: breakdown.map((row) => ({
        id: row.id,
        name: row.name,
        currency: row.currency,
        invoiced: Number(row.invoiced),
        collected: Number(row.collected),
        invoiceCount: Number(row.invoice_count),
      })),
    };
  }

  private toMoneyTotals(row: {
    currency: Currency;
    invoiced: number;
    collected: number;
    overdue_amount: number;
    overdue_count: number;
    invoice_count: number;
  }): MoneyTotalsDto {
    const invoiced = Number(row.invoiced ?? 0);
    const collected = Number(row.collected ?? 0);
    const invoiceCount = Number(row.invoice_count ?? 0);

    return {
      currency: row.currency,
      invoiced: round(invoiced),
      collected: round(collected),
      // Derived rather than queried: what is still owed is exactly what was
      // billed minus what came in, and computing it here keeps the two from
      // ever disagreeing.
      outstanding: round(invoiced - collected),
      overdueAmount: round(Number(row.overdue_amount ?? 0)),
      overdueCount: Number(row.overdue_count ?? 0),
      invoiceCount,
      averageInvoice: invoiceCount === 0 ? 0 : round(invoiced / invoiceCount),
    };
  }

  /**
   * Who is asking, and how much they may see.
   *
   * A tenant admin naming another workspace is refused rather than quietly
   * given their own: silently narrowing what was asked for would let them read
   * an empty dashboard as an empty workspace.
   */
  private resolveScope(query: DashboardQueryDto): {
    scope: FinancialScope;
    dashboardScope: DashboardScope;
  } {
    const principal = this.requestContext.getPrincipal();
    const { from, to } = resolveRange(query);

    const branchIds = principal.branches.map((branch) => branch.id);

    switch (principal.subject.type) {
      case SubjectType.PLATFORM_OWNER:
        return {
          dashboardScope: DashboardScope.PLATFORM_OWNER,
          scope: {
            tenantId: query.tenantId ?? null,
            orgUnitIds: null,
            from,
            to,
            // Narrowed to one workspace, per-workspace rows would all be the
            // same workspace; branches are the useful cut at that point.
            breakdownBy: query.tenantId ? 'ORG_UNIT' : 'TENANT',
          },
        };

      case SubjectType.TENANT_ADMIN: {
        const tenantId = this.requireTenant(principal.tenantId, query.tenantId);
        return {
          dashboardScope: DashboardScope.TENANT_ADMIN,
          scope: {
            tenantId,
            orgUnitIds: null,
            from,
            to,
            breakdownBy: 'ORG_UNIT',
          },
        };
      }

      case SubjectType.EMPLOYEE: {
        const tenantId = this.requireTenant(principal.tenantId, query.tenantId);
        return {
          dashboardScope: DashboardScope.EMPLOYEE,
          scope: {
            tenantId,
            // An employee sees the branches they are assigned to, and only
            // those. No assignment means no figures, not all of them.
            orgUnitIds: branchIds,
            from,
            to,
            breakdownBy: 'ORG_UNIT',
          },
        };
      }

      default:
        return {
          dashboardScope: DashboardScope.DRIVER,
          scope: {
            tenantId: principal.tenantId ?? null,
            orgUnitIds: [],
            from,
            to,
            breakdownBy: 'NONE',
          },
        };
    }
  }

  private requireTenant(
    callerTenantId: string | undefined,
    requestedTenantId: string | undefined,
  ): string {
    if (!callerTenantId) {
      throw new ForbiddenException(
        'This account is not attached to a workspace.',
      );
    }

    if (requestedTenantId && requestedTenantId !== callerTenantId) {
      throw new ForbiddenException(
        'You can only read statistics for your own workspace.',
      );
    }

    return callerTenantId;
  }
}

function resolveRange(query: DashboardQueryDto): { from: Date; to: Date } {
  const to = query.to ?? new Date();
  const from =
    query.from ?? new Date(to.getFullYear(), to.getMonth(), 1, 0, 0, 0, 0);

  return { from, to };
}

/** Money is reported to two decimals; floating point drift is not a figure. */
function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
