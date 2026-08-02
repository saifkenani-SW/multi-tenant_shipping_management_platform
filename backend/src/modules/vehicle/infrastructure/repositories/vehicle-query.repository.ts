import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { VehicleQueryCriteria } from '../../application/builders/query/vehicle-query-criteria';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehiclePersistenceMapper } from '../mappers/vehicle-persistence.mapper';

const VEHICLE_COLUMNS = [
  'id',
  'tenant_id',
  'plate_number',
  'type',
  'capacity_kg',
  'status',
  'created_at',
  'updated_at',
] as const;

@Injectable()
export class VehicleQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE') private readonly kysely: Kysely<DB>,
    private readonly vehiclePersistenceMapper: VehiclePersistenceMapper,
  ) {}

  /**
   * Read repositories may join Fleet-owned tables when a read model needs it.
   * Such a join is one read operation, not repository-to-repository communication.
   */
  async findMany(criteria: VehicleQueryCriteria): Promise<[Vehicle[], number]> {
    let query = this.kysely
      .selectFrom('vehicle')
      .select(VEHICLE_COLUMNS)
      .where('tenant_id', '=', criteria.tenantId);

    let countQuery = this.kysely
      .selectFrom('vehicle')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('tenant_id', '=', criteria.tenantId);

    if (criteria.search) {
      const keyword = `%${criteria.search}%`;
      query = query.where('plate_number', 'ilike', keyword);
      countQuery = countQuery.where('plate_number', 'ilike', keyword);
    }

    if (criteria.status) {
      query = query.where('status', '=', criteria.status);
      countQuery = countQuery.where('status', '=', criteria.status);
    }

    if (criteria.type) {
      query = query.where('type', '=', criteria.type);
      countQuery = countQuery.where('type', '=', criteria.type);
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
      records.map((record) => this.vehiclePersistenceMapper.toDomain(record)),
      Number(totalCount?.count ?? 0),
    ];
  }

  async findById(tenantId: string, id: string): Promise<Vehicle | null> {
    const record = await this.kysely
      .selectFrom('vehicle')
      .select(VEHICLE_COLUMNS)
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .executeTakeFirst();

    return record ? this.vehiclePersistenceMapper.toDomain(record) : null;
  }

  async existsByPlateNumber(
    tenantId: string,
    plateNumber: string,
    excludeVehicleId?: string,
  ): Promise<boolean> {
    let query = this.kysely
      .selectFrom('vehicle')
      .select('id')
      .where('tenant_id', '=', tenantId)
      .where('plate_number', '=', plateNumber);

    if (excludeVehicleId) {
      query = query.where('id', '!=', excludeVehicleId);
    }

    return Boolean(await query.executeTakeFirst());
  }
}
