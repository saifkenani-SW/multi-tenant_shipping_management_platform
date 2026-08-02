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
    const roles = await this.roleRepository.findByIdsWithPermissions(uniqueRoleIds);

    return roles.map(role => this.mapRoleToAccessRole(role));
  }

  private mapRoleToAccessRole(role: Role): AccessRole {
    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions.map(p => p.name as Permission),
    };
  }
}
