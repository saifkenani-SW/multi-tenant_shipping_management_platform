import { ForbiddenException } from '@nestjs/common';

import { OrganizationUnitStatisticsService } from './organization-unit-statistics.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { OrganizationUnitStatsQueryDto } from '../dtos/requests/organization-unit-stats-query.dto';
import { OrgUnitStatsScope } from '../dtos/responses/organization-unit-statistics.response.dto';
import { OrgType } from '../../../organization/organization_unit/domain/enums/org-type.enum';
import { OrgUnitStatsRow } from '../../infrastructure/repositories/organization-unit-statistics.query.repository';

const TENANT = '00000000-0000-7000-8000-000000000101';
const OTHER_TENANT = '00000000-0000-7000-8000-000000000102';
const BRANCH = '00000000-0000-7000-8000-000000000502';

const counts = {
  employees: 2,
  parcelsCurrent: 4,
  parcelsIncoming: 1,
  shipmentsOrigin: 3,
  shipmentsDestination: 1,
  tripsOrigin: 1,
  tripsDestination: 0,
  manifestsOrigin: 1,
  manifestsDestination: 0,
  invoicesOrigin: 2,
  invoicesDestination: 1,
  quotationsOrigin: 1,
  quotationsDestination: 0,
  coverageLocations: 5,
};

const unit = (
  overrides: Partial<OrgUnitStatsRow> = {},
): OrgUnitStatsRow => ({
  id: BRANCH,
  tenantId: TENANT,
  tenantName: 'FastShip',
  name: 'Damascus Branch',
  type: OrgType.BRANCH,
  isActive: true,
  ...counts,
  ...overrides,
});

describe('OrganizationUnitStatisticsService', () => {
  let repository: { listUnits: jest.Mock };
  let requestContext: { getPrincipal: jest.Mock };
  let service: OrganizationUnitStatisticsService;

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

  const filterOf = () => repository.listUnits.mock.calls[0][0];

  beforeEach(() => {
    repository = { listUnits: jest.fn().mockResolvedValue([]) };
    requestContext = { getPrincipal: jest.fn() };
    service = new OrganizationUnitStatisticsService(
      repository as never,
      requestContext as never,
    );
  });

  describe('visibility', () => {
    it('lets a platform owner see every company', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.listUnits.mockResolvedValue([unit()]);

      const result = await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(result.scope).toBe(OrgUnitStatsScope.PLATFORM_OWNER);
      expect(filterOf()).toMatchObject({
        tenantId: null,
        orgUnitIds: null,
      });
      expect(result.companies[0].branches).toBeUndefined();
    });

    it('includes per-unit rows once a platform owner names a company', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.listUnits.mockResolvedValue([unit()]);

      const result = await service.getOrganizationUnitStatistics({
        tenantId: TENANT,
      } as OrganizationUnitStatsQueryDto);

      expect(filterOf()).toMatchObject({ tenantId: TENANT });
      expect(result.companies[0].branches).toHaveLength(1);
    });

    it('pins a tenant admin to their own company', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, { tenantId: TENANT });
      repository.listUnits.mockResolvedValue([unit()]);

      const result = await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(result.scope).toBe(OrgUnitStatsScope.TENANT_ADMIN);
      expect(filterOf()).toMatchObject({
        tenantId: TENANT,
        orgUnitIds: null,
      });
      expect(result.companies[0].branches).toHaveLength(1);
    });

    it('refuses a tenant admin asking for another company', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, { tenantId: TENANT });

      await expect(
        service.getOrganizationUnitStatistics({
          tenantId: OTHER_TENANT,
        } as OrganizationUnitStatsQueryDto),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.listUnits).not.toHaveBeenCalled();
    });

    it('refuses a tenant admin with no company attached', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, {});

      await expect(
        service.getOrganizationUnitStatistics(
          {} as OrganizationUnitStatsQueryDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('confines an employee to the units they are assigned to', async () => {
      signedInAs(SubjectType.EMPLOYEE, {
        tenantId: TENANT,
        branches: [BRANCH],
      });

      const result = await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(result.scope).toBe(OrgUnitStatsScope.EMPLOYEE);
      expect(filterOf()).toMatchObject({
        tenantId: TENANT,
        orgUnitIds: [BRANCH],
      });
    });

    it('gives an employee with no unit no figures rather than all of them', async () => {
      signedInAs(SubjectType.EMPLOYEE, { tenantId: TENANT, branches: [] });

      await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(filterOf().orgUnitIds).toEqual([]);
    });

    it('refuses a driver rather than inventing a dashboard', async () => {
      signedInAs(SubjectType.DRIVER, { tenantId: TENANT });

      await expect(
        service.getOrganizationUnitStatistics(
          {} as OrganizationUnitStatsQueryDto,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.listUnits).not.toHaveBeenCalled();
    });
  });

  describe('the figures', () => {
    it('keeps each company on its own row and never mixes their counts', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.listUnits.mockResolvedValue([
        unit({ tenantId: TENANT, tenantName: 'FastShip', employees: 2 }),
        unit({
          id: 'unit-2',
          tenantId: OTHER_TENANT,
          tenantName: 'QuickMail',
          employees: 7,
        }),
      ]);

      const result = await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(result.companies).toHaveLength(2);
      expect(
        result.companies.find((c) => c.tenantId === TENANT)?.employees,
      ).toBe(2);
      expect(
        result.companies.find((c) => c.tenantId === OTHER_TENANT)?.employees,
      ).toBe(7);
      expect(result.totals.employees).toBe(9);
      expect(result.totals.units).toBe(2);
    });

    it('splits units by type and active state', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, { tenantId: TENANT });
      repository.listUnits.mockResolvedValue([
        unit({ type: OrgType.BRANCH, isActive: true }),
        unit({
          id: 'hub-1',
          type: OrgType.HUB,
          isActive: false,
          name: 'Old Hub',
        }),
        unit({
          id: 'hub-2',
          type: OrgType.HUB,
          isActive: true,
          name: 'New Hub',
        }),
      ]);

      const result = await service.getOrganizationUnitStatistics(
        {} as OrganizationUnitStatsQueryDto,
      );

      expect(result.totals.units).toBe(3);
      expect(result.totals.active).toBe(2);
      expect(result.totals.inactive).toBe(1);
      expect(result.totals.byType).toEqual([
        { type: OrgType.BRANCH, total: 1, active: 1 },
        { type: OrgType.HUB, total: 2, active: 1 },
      ]);
    });
  });
});
