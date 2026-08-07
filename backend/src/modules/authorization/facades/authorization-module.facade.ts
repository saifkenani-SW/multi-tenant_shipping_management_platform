import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { AccessRole } from '../../../packages/context/principal/principal/AccessRole';
import { Permission } from '../../../core/security/Permission';
import { Role } from '../domain/role.entity';
import { Permission as DomainPermission } from '../domain/permission.entity';

@Injectable()
export class AuthorizationModuleFacade {
  constructor(private readonly roleRepository: RoleRepository) {}

  /**
   * Fetches multiple roles by ID along with their permissions.
   * Maps them to the AccessRole interface required by the Principal.
   */
  async getRolesWithPermissions(roleIds: string[]): Promise<AccessRole[]> {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    // De-duplicate role IDs
    const uniqueRoleIds = Array.from(new Set(roleIds));

    // For better performance, caching can be added here if needed,
    // but the repository might already leverage caching for single lookups.
    // Given the bulk query, it's efficient enough for now.
    const rolesResult =
      await this.roleRepository.findByIdsWithPermissions(uniqueRoleIds);

    const rolesList =
      rolesResult instanceof Map
        ? Array.from(rolesResult.values())
        : rolesResult;

    return rolesList.map((role) => this.mapRoleToAccessRole(role));
  }

  /**
   * Validates if all provided role IDs exist for a given tenant.
   * Returns true if all exist, false otherwise.
   */
  async validateRolesExist(
    tenantId: string,
    roleIds: string[],
  ): Promise<boolean> {
    if (!roleIds || roleIds.length === 0) {
      return true;
    }

    const uniqueRoleIds = Array.from(new Set(roleIds));
    const rolesResult =
      await this.roleRepository.findByIdsWithPermissions(uniqueRoleIds);
    const rolesList =
      rolesResult instanceof Map
        ? Array.from(rolesResult.values())
        : rolesResult;

    const validRoles = rolesList.filter((role) => role.tenantId === tenantId);
    return validRoles.length === uniqueRoleIds.length;
  }

  private mapRoleToAccessRole(role: Role): AccessRole {
    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions.map((p) => p.name as Permission),
    };
  }
}
