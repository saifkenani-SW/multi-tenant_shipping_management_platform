import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { ICacheProvider } from '../../../../core/cache/interfaces/ICacheProvider';
import { CACHE_PROVIDER } from '../../../../core/cache/tokens/cache.tokens';

@Injectable()
export class PermissionCacheService {
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cacheProvider: ICacheProvider,
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

  /** الفروع (organization_unit) يلي الموظف معيّن عليها فعلياً */
  async getUserOrgUnitIds(userId: string): Promise<string[]> {
    const cacheKey = `employee:${userId}:org-units`;
    let orgUnitIds = await this.cacheProvider.get<string[]>(cacheKey);

    if (!orgUnitIds) {
      const employee = await this.prisma.employee.findFirst({
        where: { user_id: userId, is_active: true },
        include: {
          employee_assignment: { where: { is_active: true } },
        },
      });

      orgUnitIds = (employee?.employee_assignment ?? []).map(
        (a) => a.organization_unit_id,
      );

      await this.cacheProvider.set(cacheKey, orgUnitIds, 3600);
    }

    return orgUnitIds;
  }

  /** أدوار الموظف بس بالتعيين (assignment) يلي على هاد الفرع بالتحديد — مش كل أدواره بالشركة */
  async getUserRoleIdsForOrgUnit(
    userId: string,
    organizationUnitId: string,
  ): Promise<string[]> {
    const cacheKey = `employee:${userId}:org:${organizationUnitId}:roles`;
    let roleIds = await this.cacheProvider.get<string[]>(cacheKey);

    if (!roleIds) {
      const employee = await this.prisma.employee.findFirst({
        where: { user_id: userId, is_active: true },
        include: {
          employee_assignment: {
            where: {
              organization_unit_id: organizationUnitId,
              is_active: true,
            },
            include: { assignment_role: true },
          },
        },
      });

      roleIds = [];
      for (const assignment of employee?.employee_assignment ?? []) {
        for (const ar of assignment.assignment_role) {
          if (!roleIds.includes(ar.role_id)) {
            roleIds.push(ar.role_id);
          }
        }
      }

      await this.cacheProvider.set(cacheKey, roleIds, 3600);
    }

    return roleIds;
  }

  /**
   * تُستدعى عند تغيير صلاحيات دور.
   *
   * بدونها تبقى القوائم أعلاه صالحة ساعة كاملة، أي أن سحب صلاحية من
   * دور لا يسري إلا بعد انتهاء الـ TTL.
   */
  async invalidateRolePermissions(roleId: string): Promise<void> {
    await this.cacheProvider.del(`role:${roleId}:permissions`);
  }

  /**
   * تُستدعى عند تغيير تعيينات موظف أو أدواره أو تعطيله.
   */
  async invalidateUserAccess(userId: string): Promise<void> {
    await Promise.all([
      this.cacheProvider.del(`employee:${userId}:roles`),
      this.cacheProvider.del(`employee:${userId}:org-units`),
      this.cacheProvider.delByPattern(`employee:${userId}:org:*:roles`),
    ]);
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
