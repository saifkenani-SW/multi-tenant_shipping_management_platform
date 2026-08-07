import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import {
  EMPLOYEE_CACHE_KEYS,
  EMPLOYEE_CACHE_TTL,
} from '../../constants/employee.cache.constants';

@Injectable()
export class EmployeeQueryRepository {
  constructor(@Inject('KYSELY_INSTANCE') private readonly db: Kysely<DB>) {}

  @Cacheable({
    ttl: EMPLOYEE_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string) {
    const query = this.db
      .selectFrom('employee')
      .selectAll()
      .where('id', '=', id);

    const record = await query.executeTakeFirst();
    if (!record) return null;

    const rawAssignments = await this.db
      .selectFrom('employee_assignment as ea')
      .leftJoin('assignment_role as ar', 'ar.assignment_id', 'ea.id')
      .select([
        'ea.id as assignment_id',
        'ea.organization_unit_id',
        'ar.role_id',
      ])
      .where('ea.employee_id', '=', id)
      .where('ea.is_active', '=', true)
      .execute();

    const assignmentsMap = new Map<
      string,
      { assignmentId: string; roleIds: string[] }
    >();
    for (const row of rawAssignments) {
      const existing = assignmentsMap.get(row.organization_unit_id) || {
        assignmentId: row.assignment_id,
        roleIds: [],
      };
      if (row.role_id) {
        existing.roleIds.push(row.role_id);
      }
      assignmentsMap.set(row.organization_unit_id, existing);
    }

    const assignmentsArray = Array.from(assignmentsMap.entries()).map(
      ([orgId, data]) => ({
        assignmentId: data.assignmentId,
        organizationUnitId: orgId,
        roleIds: Array.from(new Set(data.roleIds)),
      }),
    );

    return {
      id: record.id,
      tenantId: record.tenant_id,
      userId: record.user_id,
      employeeCode: record.employee_code,
      fullName: record.full_name,
      nationalId: record.national_id || undefined,
      isActive: record.is_active,
      rawAssignments: assignmentsArray,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  @Cacheable({
    ttl: EMPLOYEE_CACHE_TTL.LIST,
    keyBuilder: (
      limit: number,
      offset: number,
      search?: string,
      tenantId?: string,
      organizationUnitId?: string,
    ) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      tenantId || 'none',
      limit,
      offset,
      search || 'none',
      organizationUnitId || 'none',
    ],
  })
  async findMany(
    limit: number,
    offset: number,
    search?: string,
    tenantId?: string,
    organizationUnitId?: string,
  ) {
    let query = this.db
      .selectFrom('employee as e')
      .leftJoin('employee_assignment as ea', (join) =>
        join.onRef('ea.employee_id', '=', 'e.id').on('ea.is_active', '=', true),
      )
      .selectAll('e')
      .select(({ fn }) =>
        fn
          .coalesce(
            fn
              .agg<string[]>('json_agg', ['ea.organization_unit_id'])
              .filterWhere('ea.organization_unit_id', 'is not', null),
            sql<string>`'[]'::json`,
          )
          .as('assignments'),
      )
      .groupBy('e.id');

    if (tenantId) {
      query = query.where('e.tenant_id', '=', tenantId);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('e.full_name', 'ilike', `${search}%`),
          eb('e.employee_code', 'ilike', `${search}%`),
        ]),
      );
    }

    if (organizationUnitId) {
      query = query.where(({ exists, selectFrom }) =>
        exists(
          selectFrom('employee_assignment as ea2')
            .select('ea2.id')
            .whereRef('ea2.employee_id', '=', 'e.id')
            .where('ea2.organization_unit_id', '=', organizationUnitId)
            .where('ea2.is_active', '=', true),
        ),
      );
    }

    const records = await query.limit(limit).offset(offset).execute();
    return records.map((record) => ({
      id: record.id,
      tenantId: record.tenant_id,
      userId: record.user_id,
      employeeCode: record.employee_code,
      fullName: record.full_name,
      nationalId: record.national_id || undefined,
      isActive: record.is_active,
      organizationUnitIds: Array.isArray(record.assignments)
        ? record.assignments
        : typeof record.assignments === 'string'
          ? JSON.parse(record.assignments)
          : [],
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }

  async countByTenantId(
    tenantId?: string,
    search?: string,
    organizationUnitId?: string,
  ) {
    let query = this.db
      .selectFrom('employee as e')
      .select((eb) => eb.fn.count('e.id').as('count'));

    if (tenantId) {
      query = query.where('e.tenant_id', '=', tenantId);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('e.full_name', 'ilike', `${search}%`),
          eb('e.employee_code', 'ilike', `${search}%`),
        ]),
      );
    }

    if (organizationUnitId) {
      query = query.where(({ exists, selectFrom }) =>
        exists(
          selectFrom('employee_assignment as ea2')
            .select('ea2.id')
            .whereRef('ea2.employee_id', '=', 'e.id')
            .where('ea2.organization_unit_id', '=', organizationUnitId)
            .where('ea2.is_active', '=', true),
        ),
      );
    }

    const result = await query.executeTakeFirst();

    return Number(result?.count || 0);
  }
}
