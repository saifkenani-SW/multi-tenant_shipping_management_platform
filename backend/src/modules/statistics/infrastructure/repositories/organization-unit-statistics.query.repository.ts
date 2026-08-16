import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';

import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { OrgType } from '../../../organization/organization_unit/domain/enums/org-type.enum';

export interface OrgUnitStatsScopeFilter {
  /** Null only for a platform owner looking across every company. */
  tenantId: string | null;

  /**
   * Units the caller may see. Null means no unit restriction; an empty
   * array means the caller can see nothing, which is not the same thing.
   */
  orgUnitIds: string[] | null;
}

export interface OrgUnitStatsRow {
  id: string;
  tenantId: string;
  tenantName: string | null;
  name: string;
  type: OrgType;
  isActive: boolean;
  employees: number;
  parcelsCurrent: number;
  parcelsIncoming: number;
  shipmentsOrigin: number;
  shipmentsDestination: number;
  tripsOrigin: number;
  tripsDestination: number;
  manifestsOrigin: number;
  manifestsDestination: number;
  invoicesOrigin: number;
  invoicesDestination: number;
  quotationsOrigin: number;
  quotationsDestination: number;
  coverageLocations: number;
}

@Injectable()
export class OrganizationUnitStatisticsQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: Kysely<DB>,
  ) {}

  /**
   * One row per unit in scope, with a count from every table that points
   * at that unit. Counts are pre-aggregated so the join never multiplies
   * rows.
   */
  async listUnits(scope: OrgUnitStatsScopeFilter): Promise<OrgUnitStatsRow[]> {
    if (scope.orgUnitIds && scope.orgUnitIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .selectFrom('organization_unit as ou')
      .innerJoin('tenant as t', 't.id', 'ou.tenant_id')
      .leftJoin(this.activeEmployees().as('emp'), (join) =>
        join.onRef('emp.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('parcel', 'current_org_unit_id').as('parcels_here'),
        (join) => join.onRef('parcels_here.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(this.incomingParcels().as('parcels_in'), (join) =>
        join.onRef('parcels_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('customer_shipment', 'origin_org_unit_id').as('ship_out'),
        (join) => join.onRef('ship_out.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('customer_shipment', 'destination_org_unit_id').as(
          'ship_in',
        ),
        (join) => join.onRef('ship_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('trip', 'origin_org_unit_id').as('trip_out'),
        (join) => join.onRef('trip_out.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('trip', 'destination_org_unit_id').as('trip_in'),
        (join) => join.onRef('trip_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('transport_manifest', 'origin_org_unit_id').as(
          'manifest_out',
        ),
        (join) => join.onRef('manifest_out.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('transport_manifest', 'destination_org_unit_id').as(
          'manifest_in',
        ),
        (join) => join.onRef('manifest_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('invoice', 'origin_org_unit_id').as('invoice_out'),
        (join) => join.onRef('invoice_out.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('invoice', 'destination_org_unit_id').as('invoice_in'),
        (join) => join.onRef('invoice_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('quotation', 'origin_org_unit_id').as('quote_out'),
        (join) => join.onRef('quote_out.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('quotation', 'destination_org_unit_id').as('quote_in'),
        (join) => join.onRef('quote_in.org_unit_id', '=', 'ou.id'),
      )
      .leftJoin(
        this.countBy('org_unit_location_mapping', 'organization_unit_id').as(
          'coverage',
        ),
        (join) => join.onRef('coverage.org_unit_id', '=', 'ou.id'),
      )
      .select([
        'ou.id as id',
        'ou.tenant_id as tenantId',
        't.name as tenantName',
        'ou.name as name',
        'ou.org_type as type',
        'ou.is_active as isActive',
        sql<number>`COALESCE(emp.count, 0)`.as('employees'),
        sql<number>`COALESCE(parcels_here.count, 0)`.as('parcelsCurrent'),
        sql<number>`COALESCE(parcels_in.count, 0)`.as('parcelsIncoming'),
        sql<number>`COALESCE(ship_out.count, 0)`.as('shipmentsOrigin'),
        sql<number>`COALESCE(ship_in.count, 0)`.as('shipmentsDestination'),
        sql<number>`COALESCE(trip_out.count, 0)`.as('tripsOrigin'),
        sql<number>`COALESCE(trip_in.count, 0)`.as('tripsDestination'),
        sql<number>`COALESCE(manifest_out.count, 0)`.as('manifestsOrigin'),
        sql<number>`COALESCE(manifest_in.count, 0)`.as('manifestsDestination'),
        sql<number>`COALESCE(invoice_out.count, 0)`.as('invoicesOrigin'),
        sql<number>`COALESCE(invoice_in.count, 0)`.as('invoicesDestination'),
        sql<number>`COALESCE(quote_out.count, 0)`.as('quotationsOrigin'),
        sql<number>`COALESCE(quote_in.count, 0)`.as('quotationsDestination'),
        sql<number>`COALESCE(coverage.count, 0)`.as('coverageLocations'),
      ])
      .where(this.scopeFilter(scope))
      .orderBy('t.name')
      .orderBy('ou.name')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      name: row.name,
      type: row.type as OrgType,
      isActive: Boolean(row.isActive),
      employees: Number(row.employees),
      parcelsCurrent: Number(row.parcelsCurrent),
      parcelsIncoming: Number(row.parcelsIncoming),
      shipmentsOrigin: Number(row.shipmentsOrigin),
      shipmentsDestination: Number(row.shipmentsDestination),
      tripsOrigin: Number(row.tripsOrigin),
      tripsDestination: Number(row.tripsDestination),
      manifestsOrigin: Number(row.manifestsOrigin),
      manifestsDestination: Number(row.manifestsDestination),
      invoicesOrigin: Number(row.invoicesOrigin),
      invoicesDestination: Number(row.invoicesDestination),
      quotationsOrigin: Number(row.quotationsOrigin),
      quotationsDestination: Number(row.quotationsDestination),
      coverageLocations: Number(row.coverageLocations),
    }));
  }

  private activeEmployees() {
    return this.db
      .selectFrom('employee_assignment')
      .select(({ fn }) => [
        'organization_unit_id as org_unit_id',
        fn.countAll<number>().as('count'),
      ])
      .where('is_active', '=', true)
      .groupBy('organization_unit_id');
  }

  private countBy(
    table:
      | 'parcel'
      | 'customer_shipment'
      | 'trip'
      | 'transport_manifest'
      | 'invoice'
      | 'quotation'
      | 'org_unit_location_mapping',
    column: string,
  ) {
    return this.db
      .selectFrom(table)
      .select(({ fn }) => [
        sql<string>`${sql.ref(column)}`.as('org_unit_id'),
        fn.countAll<number>().as('count'),
      ])
      .where(sql`${sql.ref(column)} is not null`)
      .groupBy(sql.ref(column));
  }

  private incomingParcels() {
    return this.db
      .selectFrom('parcel')
      .select(({ fn }) => [
        'destination_org_unit_id as org_unit_id',
        fn.countAll<number>().as('count'),
      ])
      .where('destination_org_unit_id', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('current_org_unit_id', 'is', null),
          eb('current_org_unit_id', '!=', eb.ref('destination_org_unit_id')),
        ]),
      )
      .groupBy('destination_org_unit_id');
  }

  private scopeFilter(scope: OrgUnitStatsScopeFilter) {
    const conditions = [sql<boolean>`TRUE`];

    if (scope.tenantId) {
      conditions.push(sql<boolean>`ou.tenant_id = ${scope.tenantId}::uuid`);
    }

    if (scope.orgUnitIds && scope.orgUnitIds.length > 0) {
      conditions.push(
        sql<boolean>`ou.id = ANY(${scope.orgUnitIds}::uuid[])`,
      );
    }

    return conditions.reduce(
      (all, one) => sql<boolean>`${all} AND ${one}`,
    ) as never;
  }
}
