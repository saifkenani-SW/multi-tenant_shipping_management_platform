import { EmployeeQueryCriteria } from '../builders/query/employee-query-criteria';
import { Employee } from '../domain/employee.entity';

export interface IRoleTenantRow {
  readonly id: string;
  readonly tenantId: string;
}

export interface IAssignmentOwnerRow {
  readonly assignmentId: string;
  readonly employeeId: string;
  readonly tenantId: string;
}

export interface IScopeAccessRow {
  readonly scopeId: string;
  readonly orgType: string;
  readonly roleId: string;
}


export interface IEmployeeQueryRepository {
  findMany(criteria: EmployeeQueryCriteria): Promise<[Employee[], number]>;

  /** بدون التعيينات — للفحوص التي تحتاج ملكية الـ tenant فقط. */
  findById(id: string): Promise<Employee | null>;

  /** مع التعيينات وأدوارها — لشاشة التفاصيل. */
  findByIdWithAssignments(id: string): Promise<Employee | null>;

  existsByEmployeeCode(
    tenantId: string,
    employeeCode: string,
    excludeEmployeeId?: string,
  ): Promise<boolean>;

  existsByEmail(email: string): Promise<boolean>;

  findAssignment(assignmentId: string): Promise<IAssignmentOwnerRow | null>;

  existsAssignment(
    employeeId: string,
    organizationUnitId: string,
  ): Promise<boolean>;

  /** يرجّع الشركة المالكة لكل وحدة تنظيمية مطلوبة. */
  findOrganizationUnitTenant(unitId: string): Promise<string | null>;

  /** يرجّع الشركة المالكة لكل دور من القائمة. */
  findRoleTenants(roleIds: readonly string[]): Promise<IRoleTenantRow[]>;

  /** 
   * يجلب كل المنشآت (فروع ومستودعات) التابعة للموظف عبر شجرة المواقع (ltree)
   * مع جميع أدوارها (قد يكون للمنشأة الواحدة أكثر من دور).
   */
  getEmployeeAssignmentsWithRoles(userId: string, tenantId: string): Promise<IScopeAccessRow[]>;
}
