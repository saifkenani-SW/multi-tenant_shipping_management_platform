import { ForbiddenException } from '@nestjs/common';
import { Currency, InvoiceStatus } from '@prisma/client';

import { FinancialStatisticsService } from './financial-statistics.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { DashboardQueryDto } from '../dtos/requests/dashboard-query.dto';
import { DashboardScope } from '../dtos/responses/financial-dashboard.response.dto';

const TENANT = '00000000-0000-7000-8000-000000000101';
const OTHER_TENANT = '00000000-0000-7000-8000-000000000102';
const BRANCH = '00000000-0000-7000-8000-000000000502';

describe('FinancialStatisticsService', () => {
  let repository: {
    money: jest.Mock;
    byStatus: jest.Mock;
    breakdown: jest.Mock;
  };
  let requestContext: { getPrincipal: jest.Mock };
  let service: FinancialStatisticsService;

  const signedInAs = (
    type: SubjectType,
    opts: { tenantId?: string; branches?: string[] } = {},
  ) =>
    requestContext.getPrincipal.mockReturnValue({
      subject: { id: 'user-1', type },
      tenantId: opts.tenantId,
      branches: (opts.branches ?? []).map((id) => ({ id })),
      warehouses: [],
    });

  const scopeOf = () => repository.money.mock.calls[0][0];

  beforeEach(() => {
    repository = {
      money: jest.fn().mockResolvedValue([]),
      byStatus: jest.fn().mockResolvedValue([]),
      breakdown: jest.fn().mockResolvedValue([]),
    };
    requestContext = { getPrincipal: jest.fn() };
    service = new FinancialStatisticsService(
      repository as never,
      requestContext as never,
    );
  });

  describe('visibility', () => {
    it('lets a platform owner see every workspace', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.scope).toBe(DashboardScope.PLATFORM_OWNER);
      expect(scopeOf()).toMatchObject({
        tenantId: null,
        orgUnitIds: null,
        breakdownBy: 'TENANT',
      });
    });

    it('breaks a platform owner down by branch once narrowed to one workspace', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      await service.getFinancialDashboard({
        tenantId: OTHER_TENANT,
      } as DashboardQueryDto);

      expect(scopeOf()).toMatchObject({
        tenantId: OTHER_TENANT,
        breakdownBy: 'ORG_UNIT',
      });
    });

    it('pins a tenant admin to their own workspace', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, { tenantId: TENANT });

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.scope).toBe(DashboardScope.TENANT_ADMIN);
      expect(scopeOf()).toMatchObject({
        tenantId: TENANT,
        breakdownBy: 'ORG_UNIT',
      });
    });

    it('refuses a tenant admin asking for another workspace', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, { tenantId: TENANT });

      await expect(
        service.getFinancialDashboard({
          tenantId: OTHER_TENANT,
        } as DashboardQueryDto),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.money).not.toHaveBeenCalled();
    });

    it('refuses a tenant admin with no workspace attached', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, {});

      await expect(
        service.getFinancialDashboard({} as DashboardQueryDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('confines an employee to the branches they are assigned to', async () => {
      signedInAs(SubjectType.EMPLOYEE, {
        tenantId: TENANT,
        branches: [BRANCH],
      });

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.scope).toBe(DashboardScope.EMPLOYEE);
      expect(scopeOf()).toMatchObject({
        tenantId: TENANT,
        orgUnitIds: [BRANCH],
      });
    });

    it('gives an employee with no branch no figures rather than all of them', async () => {
      signedInAs(SubjectType.EMPLOYEE, { tenantId: TENANT, branches: [] });

      await service.getFinancialDashboard({} as DashboardQueryDto);

      // An empty list, not null: null would lift the branch filter entirely.
      expect(scopeOf().orgUnitIds).toEqual([]);
    });

    it('gives a driver the same shape with nothing in it, and never queries', async () => {
      signedInAs(SubjectType.DRIVER, { tenantId: TENANT });

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.scope).toBe(DashboardScope.DRIVER);
      expect(result.money).toEqual([]);
      expect(result.byStatus).toEqual([]);
      expect(repository.money).not.toHaveBeenCalled();
    });
  });

  describe('the period', () => {
    it('defaults to the current month', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      await service.getFinancialDashboard({} as DashboardQueryDto);

      const { from, to } = scopeOf();
      expect(from.getDate()).toBe(1);
      expect(from.getMonth()).toBe(to.getMonth());
    });

    it('honours an explicit range', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      const from = new Date('2026-01-01');
      const to = new Date('2026-03-31');

      await service.getFinancialDashboard({ from, to } as DashboardQueryDto);

      expect(scopeOf()).toMatchObject({ from, to });
    });
  });

  describe('the figures', () => {
    it('derives outstanding from what was billed less what came in', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.money.mockResolvedValue([
        {
          currency: Currency.USD,
          invoiced: 66.5,
          collected: 40.25,
          overdue_amount: 0,
          overdue_count: 0,
          invoice_count: 2,
        },
      ]);

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.money[0].outstanding).toBe(26.25);
      expect(result.money[0].averageInvoice).toBe(33.25);
    });

    it('keeps currencies apart instead of adding them together', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.money.mockResolvedValue([
        {
          currency: Currency.SY,
          invoiced: 1000000,
          collected: 400000,
          overdue_amount: 0,
          overdue_count: 0,
          invoice_count: 4,
        },
        {
          currency: Currency.USD,
          invoiced: 100,
          collected: 100,
          overdue_amount: 0,
          overdue_count: 0,
          invoice_count: 1,
        },
      ]);

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.money).toHaveLength(2);
      expect(result.money.map((m) => m.currency)).toEqual([
        Currency.SY,
        Currency.USD,
      ]);
    });

    it('reports a zero average rather than dividing by no invoices', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.money.mockResolvedValue([
        {
          currency: Currency.SY,
          invoiced: 0,
          collected: 0,
          overdue_amount: 0,
          overdue_count: 0,
          invoice_count: 0,
        },
      ]);

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.money[0].averageInvoice).toBe(0);
    });

    it('passes the status buckets through as numbers', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.byStatus.mockResolvedValue([
        {
          status: InvoiceStatus.UNPAID,
          currency: Currency.USD,
          count: '1',
          amount: '26.25',
        },
      ]);

      const result = await service.getFinancialDashboard(
        {} as DashboardQueryDto,
      );

      expect(result.byStatus[0]).toEqual({
        status: InvoiceStatus.UNPAID,
        currency: Currency.USD,
        count: 1,
        amount: 26.25,
      });
    });
  });
});
