import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { Permission } from '../../../core/security/Permission';
import { SubjectType } from '../../../packages/context/principal/principal/SubjectType';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw (
        err ??
        new UnauthorizedException('Invalid or missing authentication tokens')
      );
    }
    console.log('User authenticated:', user);
    this.requestContext.setPrincipal({
      subject: {
        id: user.sub,
        type: user.type ?? SubjectType.PLATFORM_ADMIN,
      },
      tenantId: undefined,
      branches: [
        {
          id: 'branch-1',
          role: {
            id: 'platform-admin',
            name: 'Platform Admin',
            permissions: Object.values(Permission),
          },
        },
      ],
      warehouses: [],
    });

    return user;
  }
}
