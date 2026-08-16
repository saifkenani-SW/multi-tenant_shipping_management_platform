import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { EmployeeQueryCriteria } from '../builders/query/employee-query-criteria';
import {
  EMPLOYEE_CACHE_KEYS,
  EMPLOYEE_CACHE_TTL,
} from '../constants/employee.cache.constants';
import { EmployeeAssignment } from '../domain/employee-assignment.entity';
import { Employee } from '../domain/employee.entity';
import { EmployeeSearchField } from '../enums/employee-search-field.enum';
import {
  IAssignmentOwnerRow,
  IEmployeeQueryRepository,
  IRoleTenantRow,
  IScopeAccessRow,
} from '../interfaces/employee.query.repository.interface';
import { EmployeePersistenceMapper } from '../mappers/persistence/employee.persistence.mapper';

const EMPLOYEE_COLUMNS = [
  'employee.id',
  'employee.tenant_id',
  'employee.user_id',
  'employee.employee_code',
  'employee.full_name',
  'employee.national_id',
  'employee.is_active',
  'employee.created_at',
  'employee.updated_at',
  'employee.deactivated_at',
] as const;

@Injectable()
export class EmployeeQueryRepository implements IEmployeeQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly persistenceMapper: EmployeePersistenceMapper,
  ) {}

  @Cacheable({
    ttl: EMPLOYEE_CACHE_TTL.LIST,
    keyBuilder: (criteria: EmployeeQueryCriteria) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.field ?? 'any',
      criteria.search?.keyword ?? 'all',
      criteria.tenantId ?? 'all',
      criteria.organizationUnitId ?? 'all',
      criteria.isActive ?? 'all',
    ],
  })
  async findMany(
    criteria: EmployeeQueryCriteria,
  ): Promise<[Employee[], number]> {
    // البريد يأتي من users، فالقائمة تحتاج الوصل دائماً.
    let query = this.kysely
      .selectFrom('employee')
      .innerJoin('users', 'users.id', 'employee.user_id')
      .select(EMPLOYEE_COLUMNS)
      .select(['users.email', 'users.phone']);

    let countQuery = this.kysely
      .selectFrom('employee')
      .select((eb) => eb.fn.count('employee.id').as('count'));

    if (criteria.search) {
      const field =
        criteria.search.field === EmployeeSearchField.EMPLOYEE_CODE
          ? 'employee.employee_code'
          : 'employee.full_name';
      const keyword = `%${criteria.search.keyword}%`;

      query = query.where(field, 'ilike', keyword);
      countQuery = countQuery.where(field, 'ilike', keyword);
    }

    if (criteria.tenantId) {
      query = query.where('employee.tenant_id', '=', criteria.tenantId);
      countQuery = countQuery.where(
        'employee.tenant_id',
        '=',
        criteria.tenantId,
      );
    }

    if (criteria.isActive !== undefined) {
      query = query.where('employee.is_active', '=', criteria.isActive);
      countQuery = countQuery.where(
        'employee.is_active',
        '=',
        criteria.isActive,
      );
    }

    if (criteria.organizationUnitId) {
      // التصفية بالوحدة تمر عبر التعيينات الفعّالة فقط.
      const assignedIds = this.kysely
        .selectFrom('employee_assignment')
        .select('employee_id')
        .where('organization_unit_id', '=', criteria.organizationUnitId)
        .where('is_active', '=', true);

      query = query.where('employee.id', 'in', assignedIds);
      countQuery = countQuery.where('employee.id', 'in', assignedIds);
    }

    query = query
      .orderBy('employee.full_name', 'asc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const mappedItems = items.map((item) =>
      this.persistenceMapper.toDomain(item),
    );

    return [mappedItems, total];
  }

  /**
   * غير مُخزَّن مؤقتاً: تستدعيه استراتيجيات التفويض قبل كل عملية كتابة.
   */
  async findById(id: string): Promise<Employee | null> {
    const employee = await this.kysely
      .selectFrom('employee')
      .innerJoin('users', 'users.id', 'employee.user_id')
      .select(EMPLOYEE_COLUMNS)
      .select(['users.email', 'users.phone'])
      .where('employee.id', '=', id)
      .executeTakeFirst();

    if (!employee) return null;

    return this.persistenceMapper.toDomain(employee);
  }

  @Cacheable({
    ttl: EMPLOYEE_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  async findByIdWithAssignments(id: string): Promise<Employee | null> {
    const employee = await this.kysely
      .selectFrom('employee')
      .innerJoin('users', 'users.id', 'employee.user_id')
      .select(EMPLOYEE_COLUMNS)
      .select(['users.email', 'users.phone'])
      .where('employee.id', '=', id)
      .executeTakeFirst();

    if (!employee) return null;

    const assignmentRows = await this.kysely
      .selectFrom('employee_assignment')
      .leftJoin(
        'organization_unit',
        'organization_unit.id',
        'employee_assignment.organization_unit_id',
      )
      .select([
        'employee_assignment.id',
        'employee_assignment.employee_id',
        'employee_assignment.organization_unit_id',
        'employee_assignment.is_active',
        'employee_assignment.created_at',
        'organization_unit.name as organization_unit_name',
      ])
      .where('employee_assignment.employee_id', '=', id)
      .execute();

    const assignments = await this.attachRoles(assignmentRows);

    return this.persistenceMapper.toDomain(employee, assignments);
  }

  async existsByEmployeeCode(
    tenantId: string,
    employeeCode: string,
    excludeEmployeeId?: string,
  ): Promise<boolean> {
    let query = this.kysely
      .selectFrom('employee')
      .select('id')
      .where('tenant_id', '=', tenantId)
      .where('employee_code', '=', employeeCode);

    if (excludeEmployeeId) {
      query = query.where('id', '!=', excludeEmployeeId);
    }

    return Boolean(await query.executeTakeFirst());
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.kysely
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    return Boolean(user);
  }

  async findAssignment(
    assignmentId: string,
  ): Promise<IAssignmentOwnerRow | null> {
    const row = await this.kysely
      .selectFrom('employee_assignment')
      .select(['id', 'employee_id', 'tenant_id'])
      .where('id', '=', assignmentId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      assignmentId: row.id,
      employeeId: row.employee_id,
      tenantId: row.tenant_id,
    };
  }

  async existsAssignment(
    employeeId: string,
    organizationUnitId: string,
  ): Promise<boolean> {
    const row = await this.kysely
      .selectFrom('employee_assignment')
      .select('id')
      .where('employee_id', '=', employeeId)
      .where('organization_unit_id', '=', organizationUnitId)
      .executeTakeFirst();

    return Boolean(row);
  }

  async findOrganizationUnitTenant(unitId: string): Promise<string | null> {
    const row = await this.kysely
      .selectFrom('organization_unit')
      .select('tenant_id')
      .where('id', '=', unitId)
      .executeTakeFirst();

    return row?.tenant_id ?? null;
  }

  async findRoleTenants(roleIds: readonly string[]): Promise<IRoleTenantRow[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .selectFrom('role')
      .select(['id', 'tenant_id'])
      .where('id', 'in', [...roleIds])
      .execute();

    return rows.map((row) => ({ id: row.id, tenantId: row.tenant_id }));
  }

  /**
   * أدوار كل التعيينات في استعلام واحد بدل استعلام لكل تعيين.
   */
  private async attachRoles(
    rows: readonly {
      id: string;
      employee_id: string;
      organization_unit_id: string;
      is_active: boolean;
      created_at: Date;
      organization_unit_name: string | null;
    }[],
  ): Promise<EmployeeAssignment[]> {
    if (rows.length === 0) {
      return [];
    }

    const roleRows = await this.kysely
      .selectFrom('assignment_role')
      .select(['assignment_id', 'role_id'])
      .where(
        'assignment_id',
        'in',
        rows.map((row) => row.id),
      )
      .execute();

    const rolesByAssignment = new Map<string, string[]>();

    for (const roleRow of roleRows) {
      const existing = rolesByAssignment.get(roleRow.assignment_id) ?? [];
      existing.push(roleRow.role_id);
      rolesByAssignment.set(roleRow.assignment_id, existing);
    }

    return rows.map((row) =>
      this.persistenceMapper.toAssignmentDomain(
        row,
        rolesByAssignment.get(row.id) ?? [],
      ),
    );
  }

  @Cacheable({
    ttl: EMPLOYEE_CACHE_TTL.DETAILS, // Reusing DETAILS TTL, or we can use a new one. We'll use 5 mins.
    keyBuilder: (userId: string, tenantId: string) => [
      'employee:principal',
      tenantId,
      userId,
    ],
  })
  async getEmployeeAssignmentsWithRoles(
    userId: string,
    tenantId: string,
  ): Promise<IScopeAccessRow[]> {
    const { sql } = await import('kysely');

    // We fetch the employee's assignments (parent_ou)
    // Then we join the L-tree descendant facilities (child_ou)
    // And we fetch the roles attached to the assignment.

    const rows = await this.kysely
      .selectFrom('employee as e')
      .innerJoin('employee_assignment as ea', 'ea.employee_id', 'e.id')
      .innerJoin(
        'organization_unit as parent_ou',
        'parent_ou.id',
        'ea.organization_unit_id',
      )
      // Join to find all descendant organization units of the parent assignment (or itself if tree_path is null)
      .innerJoin('organization_unit as child_ou', (join) =>
        join.on(
          sql<boolean>`child_ou.tree_path <@ parent_ou.tree_path OR child_ou.id = parent_ou.id`,
        ),
      )
      // Join assignment roles
      .innerJoin('assignment_role as ar', 'ar.assignment_id', 'ea.id')
      .where('e.user_id', '=', userId)
      .where('e.tenant_id', '=', tenantId)
      .where('e.is_active', '=', true)
      .where('ea.is_active', '=', true)
      .where('child_ou.is_active', '=', true)
      .select([
        'child_ou.id as scopeId',
        'child_ou.org_type as orgType',
        'ar.role_id as roleId',
      ])
      .execute();

    return rows.map((r) => ({
      scopeId: r.scopeId,
      orgType: r.orgType,
      roleId: r.roleId,
    }));
  }
}
