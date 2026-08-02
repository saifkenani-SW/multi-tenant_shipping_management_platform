import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/authorization.constants';
import {
  AuthenticatedUser,
  UserRole,
} from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException(
        'Access denied: User is not authenticated or has no roles assigned.',
      );
    }

    const userRoles = this.extractRoleStrings(user.roles);
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        'Access denied: Insufficient role permissions.',
      );
    }

    return true;
  }

  private extractRoleStrings(roles: UserRole[]): string[] {
    return roles.map((role) => {
      if (typeof role === 'string') {
        return role;
      }
      return role.code ?? role.name ?? role.slug ?? role.id ?? '';
    });
  }
}
