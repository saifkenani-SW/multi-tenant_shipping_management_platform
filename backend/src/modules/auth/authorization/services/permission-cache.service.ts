import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { ICacheProvider } from '../../../../core/cache/interfaces/ICacheProvider';

@Injectable()
export class PermissionCacheService {
  constructor(
    @Inject('ICacheProvider') private readonly cacheProvider: ICacheProvider,
    private readonly prisma: PrismaService,
  ) {}

  async getUserRoleIds(userId: string): Promise<string[]> {
    const cacheKey = `employee:${userId}:roles`;
    let roleIds = await this.cacheProvider.get<string[]>(cacheKey);

    if (!roleIds) {
      const employee = await this.prisma.employee.findFirst({
        where: { user_id: userId, is_active: true },
        include: {
          employee_assignment: {
            include: {
              assignment_role: true,
            },
          },
        },
      });

      roleIds = [];
      if (employee && employee.employee_assignment) {
        for (const assignment of employee.employee_assignment) {
          if (assignment.assignment_role) {
            for (const ar of assignment.assignment_role) {
              if (!roleIds.includes(ar.role_id)) {
                roleIds.push(ar.role_id);
              }
            }
          }
        }
      }

      await this.cacheProvider.set(cacheKey, roleIds, 3600);
    }

    return roleIds;
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const cacheKey = `role:${roleId}:permissions`;
    let permissions = await this.cacheProvider.get<string[]>(cacheKey);

    if (!permissions) {
      const rolePermissions = await this.prisma.role_permission.findMany({
        where: { role_id: roleId },
        include: { permission: true },
      });

      permissions = rolePermissions.map((rp: any) => rp.permission.name);
      await this.cacheProvider.set(cacheKey, permissions, 3600);
    }

    return permissions;
  }
}
