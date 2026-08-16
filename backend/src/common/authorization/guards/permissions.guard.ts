import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants/authorization.constants';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../packages/context/principal/principal/SubjectType';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const principal = this.requestContext.getPrincipal();

    if (!principal) {
      throw new ForbiddenException(
        'Access denied: Principal not found in context.',
      );
    }

    const subjectType = principal.subject.type;

    // 1. Platform Admins & Tenant Admins bypass permission checks
    if (
      subjectType === SubjectType.PLATFORM_OWNER ||
      subjectType === SubjectType.TENANT_ADMIN ||
      subjectType === SubjectType.DRIVER
    ) {
      return true;
    }

    // 2. Drivers and Customers typically don't use this RBAC guard directly,
    // but if they hit a protected route, they are denied unless specifically handled.
    if (subjectType !== SubjectType.EMPLOYEE) {
      throw new ForbiddenException(
        'Access denied: User type does not support granular permissions.',
      );
    }

    // 3. Employee: Check if the required permissions exist in ANY of their assigned scopes
    // (The domain layer will enforce exact scope matching later)
    const hasPermissionAnywhere = requiredPermissions.every((requiredPerm) => {
      const existsInBranches = principal.branches.some((branch) =>
        branch.role.permissions.includes(requiredPerm as any),
      );
      const existsInWarehouses = principal.warehouses.some((warehouse) =>
        warehouse.role.permissions.includes(requiredPerm as any),
      );

      return existsInBranches || existsInWarehouses;
    });

    if (!hasPermissionAnywhere) {
      throw new ForbiddenException(
        'Access denied: Missing required permission(s).',
      );
    }

    return true;
  }
}
