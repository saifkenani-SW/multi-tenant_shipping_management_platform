import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
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
    keyBuilder: (id: string) => [
      EMPLOYEE_CACHE_KEYS.DETAILS,
      id,
    ],
  })
  async findById(id: string) {
    const query = this.db.selectFrom('employee').selectAll().where('id', '=', id);

    const record = await query.executeTakeFirst();
    if (!record) return null;

    return {
      id: record.id,
      tenantId: record.tenant_id,
      userId: record.user_id,
      employeeCode: record.employee_code,
      fullName: record.full_name,
      nationalId: record.national_id || undefined,
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
    ) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      tenantId || 'none',
      limit,
      offset,
      search || 'none',
    ],
  })
  async findMany(
    limit: number,
    offset: number,
    search?: string,
    tenantId?: string,
  ) {
    let query = this.db.selectFrom('employee').selectAll();

    if (tenantId) {
      query = query.where('tenant_id', '=', tenantId);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('full_name', 'ilike', `%${search}%`),
          eb('employee_code', 'ilike', `%${search}%`),
        ]),
      );
    }

    const records = await query.limit(limit).offset(offset).execute();
    return records.map(record => ({
      id: record.id,
      tenantId: record.tenant_id,
      userId: record.user_id,
      employeeCode: record.employee_code,
      fullName: record.full_name,
      nationalId: record.national_id || undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }

  async countByTenantId(tenantId?: string) {
    let query = this.db
      .selectFrom('employee')
      .select((eb) => eb.fn.count('id').as('count'));

    if (tenantId) {
      query = query.where('tenant_id', '=', tenantId);
    }

    const result = await query.executeTakeFirst();

    return Number(result?.count || 0);
  }
}
