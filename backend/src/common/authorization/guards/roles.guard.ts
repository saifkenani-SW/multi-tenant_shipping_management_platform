import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/authorization.constants';
import { RequestContextService } from '../../../packages/context/services/request-context.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    let principal;
    try {
      principal = this.requestContext.getPrincipal();
    } catch {
      throw new ForbiddenException(
        'Access denied: User is not authenticated or principal is missing.',
      );
    }

    const userRole = principal.subject.type;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        'Access denied: Insufficient role permissions.',
      );
    }

    return true;
  }
}
