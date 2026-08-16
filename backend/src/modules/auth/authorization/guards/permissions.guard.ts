import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionCacheService } from '../services/permission-cache.service';
import type { JwtPayload } from '../../types/auth.types';
import { UserLoginType } from '../../types/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionCacheService: PermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('User is not authenticated.');
    }

    if (
      user.type === UserLoginType.PLATFORM_OWNER ||
      user.type === UserLoginType.TENANT_ADMIN
    ) {
      return true;
    }

    if (user.type !== UserLoginType.EMPLOYEE) {
      throw new ForbiddenException(
        'Only employees can have permissions evaluated.',
      );
    }

    const roleIds = await this.permissionCacheService.getUserRoleIds(user.sub);
    const aggregatedPermissions = new Set<string>();

    for (const roleId of roleIds) {
      const perms =
        await this.permissionCacheService.getRolePermissions(roleId);
      for (const p of perms) {
        aggregatedPermissions.add(p);
      }
    }

    const hasPermission = requiredPermissions.every((permission) =>
      aggregatedPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the necessary permissions.',
      );
    }

    return true;
  }
}
