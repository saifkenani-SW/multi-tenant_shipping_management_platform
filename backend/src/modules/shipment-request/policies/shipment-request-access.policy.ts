import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import { Permission } from '../../../core/security/Permission';
/**
 * طبقة السياسات (Policy) لطلبات الشحنة.
 *
 * الصلاحيات هون على مستوى الفرع (organization_unit) مش على مستوى الشركة —
 * الموظف لازم يكون معيّن بالتحديد على فرع المصدر (origin) أو فرع الوجهة
 * (destination) تبع الطلب، وعندو الصلاحية المطلوبة بهيك التعيين، حتى يقدر
 * يشوف/يتصرف بالطلب.
 */
@Injectable()
export class ShipmentRequestAccessPolicy {
  constructor(
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  private relevantOrgUnitIds(request: ShipmentRequest): string[] {
    return [request.originOrgUnitId, request.destinationOrgUnitId].filter(
      (id): id is string => !!id,
    );
  }

  async canAct(
    employeeUserId: string,
    request: ShipmentRequest,
    permission: Permission,
  ): Promise<boolean> {
    const orgUnitIds = this.relevantOrgUnitIds(request);
    if (orgUnitIds.length === 0) return false;

    for (const orgUnitId of orgUnitIds) {
      const roleIds =
        await this.permissionCacheService.getUserRoleIdsForOrgUnit(
          employeeUserId,
          orgUnitId,
        );
      for (const roleId of roleIds) {
        const permissions =
          await this.permissionCacheService.getRolePermissions(roleId);
        if (permissions.includes(permission)) return true;
      }
    }

    return false;
  }

  async assertCanAct(
    employeeUserId: string,
    request: ShipmentRequest,
    permission: Permission,
  ): Promise<void> {
    const allowed = await this.canAct(employeeUserId, request, permission);
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have the necessary permissions for this branch',
      );
    }
  }

  /** الفروع يلي الموظف عندو فيها الصلاحية المطلوبة (تُستخدم لبناء القوائم) */
  async getAuthorizedOrgUnitIds(
    employeeUserId: string,
    permission: Permission,
  ): Promise<string[]> {
    const orgUnitIds =
      await this.permissionCacheService.getUserOrgUnitIds(employeeUserId);

    const authorized: string[] = [];
    for (const orgUnitId of orgUnitIds) {
      const roleIds =
        await this.permissionCacheService.getUserRoleIdsForOrgUnit(
          employeeUserId,
          orgUnitId,
        );
      for (const roleId of roleIds) {
        const permissions =
          await this.permissionCacheService.getRolePermissions(roleId);
        if (permissions.includes(permission)) {
          authorized.push(orgUnitId);
          break;
        }
      }
    }

    return authorized;
  }
}
