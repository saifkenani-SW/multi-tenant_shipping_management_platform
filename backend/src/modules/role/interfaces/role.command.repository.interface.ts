import {
  CreateRoleRepositoryData,
  UpdateRoleRepositoryData,
} from '../contracts/persistence/role-repository-data.types';
import { Role } from '../domain/role.entity';

export interface IRoleCommandRepository {
  create(data: CreateRoleRepositoryData): Promise<Role>;
  update(id: string, data: UpdateRoleRepositoryData): Promise<void>;
  delete(id: string): Promise<void>;

  /** استبدال كامل لمجموعة الصلاحيات داخل transaction واحدة. */
  setPermissions(id: string, permissionIds: readonly string[]): Promise<void>;

  /** يتحقق أن كل المعرّفات موجودة في كتالوج الصلاحيات. */
  findExistingPermissionIds(
    permissionIds: readonly string[],
  ): Promise<string[]>;
}
