import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../../infrastructure/database/generated/kysely/types';
import { ManifestQueryCriteria } from '../../application/builders/query/manifest-query-criteria';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';
import { TransportManifestPersistenceMapper } from '../mappers/transport-manifest-persistence.mapper';

const MANIFEST_COLUMNS = [
  'id',
  'tenant_id',
  'trip_id',
  'origin_org_unit_id',
  'destination_org_unit_id',
  'status',
  'created_by_employee_id',
  'created_by_employee_name',
  'created_at',
  'updated_at',
] as const;

const ITEM_COLUMNS = [
  'id',
  'manifest_id',
  'parcel_id',
  'status',
  'loaded_at',
  'unloaded_at',
  'added_by_employee_id',
  'added_by_employee_name',
] as const;

/** States in which a parcel is still committed to a manifest. */
const OCCUPYING_ITEM_STATUSES: ManifestItemStatus[] = [
  ManifestItemStatus.PENDING_LOAD,
  ManifestItemStatus.LOADED,
];

/** Manifest states that are not yet finished. */
const ACTIVE_MANIFEST_STATUSES: ManifestStatus[] = [
  ManifestStatus.OPEN,
  ManifestStatus.READY_FOR_DISPATCH,
  ManifestStatus.ASSIGNED,
  ManifestStatus.IN_TRANSIT,
];

@Injectable()
export class TransportManifestQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>,
    private readonly persistenceMapper: TransportManifestPersistenceMapper,
  ) {}

  async findMany(
    criteria: ManifestQueryCriteria,
  ): Promise<
    [Array<{ manifest: TransportManifest; itemCount: number }>, number]
  > {
    let query = this.kysely
      .selectFrom('transport_manifest as tm')
      .select(MANIFEST_COLUMNS.map((column) => `tm.${column}` as const))
      .select((eb) =>
        eb
          .selectFrom('manifest_item as mi')
          .select((inner) => inner.fn.count('mi.id').as('count'))
          .whereRef('mi.manifest_id', '=', 'tm.id')
          .as('item_count'),
      );

    let countQuery = this.kysely
      .selectFrom('transport_manifest as tm')
      .select((eb) => eb.fn.count('tm.id').as('count'));

    // Omitted only for a platform owner, who reads across every tenant.
    if (criteria.tenantId) {
      query = query.where('tm.tenant_id', '=', criteria.tenantId);
      countQuery = countQuery.where('tm.tenant_id', '=', criteria.tenantId);
    }

    if (criteria.status) {
      query = query.where('tm.status', '=', criteria.status);
      countQuery = countQuery.where('tm.status', '=', criteria.status);
    }

    if (criteria.tripId) {
      query = query.where('tm.trip_id', '=', criteria.tripId);
      countQuery = countQuery.where('tm.trip_id', '=', criteria.tripId);
    }

    if (criteria.originOrgUnitId) {
      query = query.where(
        'tm.origin_org_unit_id',
        '=',
        criteria.originOrgUnitId,
      );
      countQuery = countQuery.where(
        'tm.origin_org_unit_id',
        '=',
        criteria.originOrgUnitId,
      );
    }

    if (criteria.destinationOrgUnitId) {
      query = query.where(
        'tm.destination_org_unit_id',
        '=',
        criteria.destinationOrgUnitId,
      );
      countQuery = countQuery.where(
        'tm.destination_org_unit_id',
        '=',
        criteria.destinationOrgUnitId,
      );
    }

    if (criteria.scopeOrgUnitIds && criteria.scopeOrgUnitIds.length > 0) {
      query = query.where((eb) =>
        eb.or([
          eb('tm.origin_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
          eb('tm.destination_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
        ]),
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('tm.origin_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
          eb('tm.destination_org_unit_id', 'in', criteria.scopeOrgUnitIds!),
        ]),
      );
    }

    if (criteria.driverId) {
      query = query
        .innerJoin('trip', 'trip.id', 'tm.trip_id')
        .where('trip.driver_id', '=', criteria.driverId);

      countQuery = (countQuery as any)
        .innerJoin('trip', 'trip.id', 'tm.trip_id')
        .where('trip.driver_id', '=', criteria.driverId);
    }

    query = query
      .orderBy('tm.created_at', 'desc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [records, totalCount] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return [
      records.map((record) => ({
        manifest: this.persistenceMapper.toDomain(record),
        itemCount: Number(record.item_count ?? 0),
      })),
      Number(totalCount?.count ?? 0),
    ];
  }

  async findById(id: string): Promise<TransportManifest | null> {
    const record = await this.kysely
      .selectFrom('transport_manifest')
      .select(MANIFEST_COLUMNS)
      .where('id', '=', id)
      .executeTakeFirst();

    return record ? this.persistenceMapper.toDomain(record) : null;
  }

  async findRawById(id: string): Promise<any> {
    const record = await this.kysely
      .selectFrom('transport_manifest as tm')
      .leftJoin('trip as t', 't.id', 'tm.trip_id')
      .selectAll('tm')
      .select('t.driver_id as trip_driver_id')
      .where('tm.id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    return {
      id: record.id,
      tenantId: record.tenant_id,
      tripId: record.trip_id,
      originOrgUnitId: record.origin_org_unit_id,
      destinationOrgUnitId: record.destination_org_unit_id,
      status: record.status,
      tripDriverId: record.trip_driver_id,
    };
  }

  async findItems(manifestId: string): Promise<ManifestItem[]> {
    const records = await this.kysely
      .selectFrom('manifest_item')
      .select(ITEM_COLUMNS)
      .where('manifest_id', '=', manifestId)
      .orderBy('id', 'asc')
      .execute();

    return records.map((record) => this.persistenceMapper.itemToDomain(record));
  }

  async findItemById(
    manifestId: string,
    itemId: string,
  ): Promise<ManifestItem | null> {
    const record = await this.kysely
      .selectFrom('manifest_item')
      .select(ITEM_COLUMNS)
      .where('manifest_id', '=', manifestId)
      .where('id', '=', itemId)
      .executeTakeFirst();

    return record ? this.persistenceMapper.itemToDomain(record) : null;
  }

  /**
   * Enforces the "a parcel may belong to only one active manifest" invariant.
   *
   * Both manifest_item and transport_manifest are Fleet-owned, so this check
   * never leaves the module: a parcel is considered taken when it sits in a
   * not-yet-finished manifest in a state that still expects it to travel.
   */
  async areParcelsInActiveManifest(
    tenantId: string,
    parcelIds: string[],
    excludeManifestId?: string,
  ): Promise<boolean> {
    if (parcelIds.length === 0) return false;

    let query = this.kysely
      .selectFrom('manifest_item as mi')
      .innerJoin('transport_manifest as tm', 'tm.id', 'mi.manifest_id')
      .select('mi.id')
      .where('tm.tenant_id', '=', tenantId)
      .where('mi.parcel_id', 'in', parcelIds)
      .where('mi.status', 'in', OCCUPYING_ITEM_STATUSES)
      .where('tm.status', 'in', ACTIVE_MANIFEST_STATUSES);

    if (excludeManifestId) {
      query = query.where('tm.id', '!=', excludeManifestId);
    }

    return Boolean(await query.executeTakeFirst());
  }

  async existsItemsForParcels(
    manifestId: string,
    parcelIds: string[],
  ): Promise<boolean> {
    if (parcelIds.length === 0) return false;

    const record = await this.kysely
      .selectFrom('manifest_item')
      .select('id')
      .where('manifest_id', '=', manifestId)
      .where('parcel_id', 'in', parcelIds)
      .executeTakeFirst();

    return Boolean(record);
  }

  /**
   * Returns manifests with status READY_FOR_DISPATCH that are not yet linked
   * to any trip. Used by Fleet to find bookable manifests.
   */
  async findAvailable(
    tenantId: string,
  ): Promise<Array<{ manifest: TransportManifest; itemCount: number }>> {
    const records = await this.kysely
      .selectFrom('transport_manifest')
      .select(MANIFEST_COLUMNS)
      .where('tenant_id', '=', tenantId)
      .where('status', '=', ManifestStatus.READY_FOR_DISPATCH)
      .orderBy('created_at', 'asc')
      .execute();

    if (!records.length) return [];

    const manifestIds = records.map((r) => r.id);
    const counts = await this.kysely
      .selectFrom('manifest_item')
      .select(['manifest_id'])
      .select((eb) => eb.fn.count('id').as('item_count'))
      .where('manifest_id', 'in', manifestIds)
      .groupBy('manifest_id')
      .execute();

    const countMap = new Map(
      counts.map((c) => [c.manifest_id, Number(c.item_count)]),
    );

    return records.map((record) => ({
      manifest: this.persistenceMapper.toDomain(record),
      itemCount: countMap.get(record.id) ?? 0,
    }));
  }

  /**
   * Fetches only the manifests that are bookable (READY_FOR_DISPATCH, no trip)
   * from the given id set. Used by assignManifestsToTrip for validation.
   */
  async findBookableByIdsAndTenant(
    manifestIds: string[],
    tenantId: string,
  ): Promise<TransportManifest[]> {
    if (!manifestIds.length) return [];

    const records = await this.kysely
      .selectFrom('transport_manifest')
      .select(MANIFEST_COLUMNS)
      .where('id', 'in', manifestIds)
      .where('tenant_id', '=', tenantId)
      .where('status', '=', ManifestStatus.READY_FOR_DISPATCH)
      .execute();

    return records.map((r) => this.persistenceMapper.toDomain(r));
  }
}
