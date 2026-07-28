import { RoleQueryCriteria } from '../builders/query/role-query-criteria';
import { Role } from '../domain/role.entity';

export interface IRoleQueryRepository {
  findMany(criteria: RoleQueryCriteria): Promise<[Role[], number]>;

  /** بدون الصلاحيات — للفحوص التي تحتاج ملكية الـ tenant فقط. */
  findById(id: string): Promise<Role | null>;

  /** مع الصلاحيات — لشاشة التفاصيل. */
  findByIdWithPermissions(id: string): Promise<Role | null>;

  countAssignments(id: string): Promise<number>;

  existsByName(
    tenantId: string,
    name: string,
    excludeRoleId?: string,
  ): Promise<boolean>;
}
