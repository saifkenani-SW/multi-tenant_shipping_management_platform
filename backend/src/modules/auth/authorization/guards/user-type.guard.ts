import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_TYPES_KEY } from '../decorators/require-types.decorator';
import { UserLoginType } from '../../types/auth.types';
import type { JwtPayload } from '../../types/auth.types';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<UserLoginType[]>(
      REQUIRE_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTypes || requiredTypes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('User is not authenticated.');
    }

    if (!requiredTypes.includes(user.type)) {
      throw new ForbiddenException(
        'You do not have the required user type to access this resource.',
      );
    }

    return true;
  }
}
