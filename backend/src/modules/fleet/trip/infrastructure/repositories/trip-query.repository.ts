import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { TripQueryCriteria } from '../../application/builders/query/trip-query-criteria';
import { Trip } from '../../domain/entities/trip.entity';
import { TripPersistenceMapper } from '../mappers/trip-persistence.mapper';

const TRIP_COLUMNS = [
  'id',
  'tenant_id',
  'driver_id',
  'vehicle_id',
  'origin_org_unit_id',
  'destination_org_unit_id',
  'status',
  'scheduled_at',
  'started_at',
  'ended_at',
  'notes',
  'created_by_employee_id',
  'created_by_employee_name',
  'created_at',
  'updated_at',
] as const;

@Injectable()
export class TripQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>,
    private readonly tripPersistenceMapper: TripPersistenceMapper,
  ) {}

  async findMany(criteria: TripQueryCriteria): Promise<[Trip[], number]> {
    let query = this.kysely.selectFrom('trip').select(TRIP_COLUMNS);

    let countQuery = this.kysely
      .selectFrom('trip')
      .select((eb) => eb.fn.count('id').as('count'));

    // Omitted only for a platform owner, who reads across every tenant.
    if (criteria.tenantId) {
      query = query.where('tenant_id', '=', criteria.tenantId);
      countQuery = countQuery.where('tenant_id', '=', criteria.tenantId);
    }

    if (criteria.scopeOrgUnitIds && criteria.scopeOrgUnitIds.length > 0) {
      query = query.where((eb) =>
        eb.or([
          eb('origin_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
          eb('destination_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
        ]),
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('origin_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
          eb('destination_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
        ]),
      );
    }

    if (criteria.status) {
      query = query.where('status', '=', criteria.status);
      countQuery = countQuery.where('status', '=', criteria.status);
    }

    if (criteria.driverId) {
      query = query.where('driver_id', '=', criteria.driverId);
      countQuery = countQuery.where('driver_id', '=', criteria.driverId);
    }

    if (criteria.vehicleId) {
      query = query.where('vehicle_id', '=', criteria.vehicleId);
      countQuery = countQuery.where('vehicle_id', '=', criteria.vehicleId);
    }

    if (criteria.originOrgUnitId) {
      query = query.where('origin_org_unit_id', '=', criteria.originOrgUnitId);
      countQuery = countQuery.where(
        'origin_org_unit_id',
        '=',
        criteria.originOrgUnitId,
      );
    }

    if (criteria.destinationOrgUnitId) {
      query = query.where(
        'destination_org_unit_id',
        '=',
        criteria.destinationOrgUnitId,
      );
      countQuery = countQuery.where(
        'destination_org_unit_id',
        '=',
        criteria.destinationOrgUnitId,
      );
    }

    query = query
      .orderBy('created_at', 'desc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [records, totalCount] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return [
      records.map((record) => this.tripPersistenceMapper.toDomain(record)),
      Number(totalCount?.count ?? 0),
    ];
  }

  async findById(
    tenantId: string | undefined,
    id: string,
  ): Promise<Trip | null> {
    let query = this.kysely
      .selectFrom('trip')
      .select(TRIP_COLUMNS)
      .where('id', '=', id);

    if (tenantId) {
      query = query.where('tenant_id', '=', tenantId);
    }

    const record = await query.executeTakeFirst();

    return record ? this.tripPersistenceMapper.toDomain(record) : null;
  }

  /**
   * Counts manifests attached to a trip.
   *
   * transport_manifest is Fleet-owned, so reading it here is a single read
   * inside the module boundary, not cross-module access.
   */
  async countManifests(tenantId: string, tripId: string): Promise<number> {
    const result = await this.kysely
      .selectFrom('transport_manifest')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('tenant_id', '=', tenantId)
      .where('trip_id', '=', tripId)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async findActiveTripByDriver(
    tenantId: string,
    driverId: string,
  ): Promise<Trip | null> {
    const record = await this.kysely
      .selectFrom('trip')
      .select(TRIP_COLUMNS)
      .where('tenant_id', '=', tenantId)
      .where('driver_id', '=', driverId)
      .where('status', 'in', ['SCHEDULED', 'IN_PROGRESS'])
      .orderBy('status', 'asc') // Assuming IN_PROGRESS sorts before SCHEDULED, but wait... 'I' before 'S'. Yes.
      .orderBy('created_at', 'asc')
      .executeTakeFirst();

    return record ? this.tripPersistenceMapper.toDomain(record) : null;
  }
}
