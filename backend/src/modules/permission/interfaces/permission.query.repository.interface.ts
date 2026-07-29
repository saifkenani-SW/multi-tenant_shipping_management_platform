import { PermissionQueryCriteria } from '../builders/query/permission-query-criteria';
import { Permission } from '../domain/permission.entity';

export interface IPermissionQueryRepository {
  findMany(criteria: PermissionQueryCriteria): Promise<[Permission[], number]>;
  findById(id: string): Promise<Permission | null>;
  findByRoleId(roleId: string): Promise<Permission[]>;
}
