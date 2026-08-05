import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../packages/context/principal/principal/SubjectType';
import { EmployeeFacade } from '../../employee/facades/employee.facade';
import { UserLoginType } from '../types/auth.types';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const canActivate = await super.canActivate(context);
    if (!canActivate) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Prevent session tokens from accessing normal routes
    if (user.isSessionToken && !request.path.includes('/auth/select-profile')) {
      throw new UnauthorizedException('Profile selection required');
    }

    // Only populate principal if it's not a session token
    if (!user.isSessionToken) {
      await this.populatePrincipal(user, request);
    }
    console.log('getPrincipal        ' + this.requestContext.getPrincipal());

    return true;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw (
        err ??
        new UnauthorizedException('Invalid or missing authentication tokens')
      );
    }
    return user;
  }

  private async populatePrincipal(user: any, request?: any) {
    // 1. Platform Owner
    if (user.type === UserLoginType.PLATFORM_OWNER) {
      this.requestContext.setPrincipal({
        subject: { id: user.sub, type: SubjectType.PLATFORM_OWNER },
        branches: [],
        warehouses: [],
      });
      return;
    }

    // 2. Customer
    if (user.type === UserLoginType.CUSTOMER) {
      this.requestContext.setPrincipal({
        subject: { id: user.sub, type: SubjectType.CUSTOMER },
        profileId: user.sub, // The customer ID is typically the user ID, or you could pass profileId in JWT
        branches: [],
        warehouses: [],
      });
      return;
    }

    // 3. Tenant Admin
    if (user.type === UserLoginType.TENANT_ADMIN) {
      this.requestContext.setPrincipal({
        subject: { id: user.sub, type: SubjectType.TENANT_ADMIN },
        tenantId: user.tenantId,
        branches: [],
        warehouses: [],
      });
      return;
    }

    // 4. Driver
    if (user.type === UserLoginType.DRIVER) {
      this.requestContext.setPrincipal({
        subject: { id: user.sub, type: SubjectType.DRIVER },
        tenantId: user.tenantId,
        profileId: user.profileId, // This is the employeeId
        vehicleId: user.vehicleId, // The currently assigned vehicle
        branches: [],
        warehouses: [],
      });
      return;
    }

    // 5. Employee
    if (user.type === UserLoginType.EMPLOYEE) {
      // Lazy load EmployeeFacade to avoid Circular Dependency
      const employeeFacade = this.moduleRef.get(EmployeeFacade, {
        strict: false,
      });

      const principalDetails = await employeeFacade.getPrincipalByUserId(
        user.sub,
        user.tenantId,
      );

      if (!principalDetails) {
        throw new UnauthorizedException(
          'Employee assignments not found or deactivated',
        );
      }

      this.requestContext.setPrincipal({
        subject: { id: user.sub, type: SubjectType.EMPLOYEE },
        tenantId: user.tenantId,
        profileId: user.profileId, // This is the employeeId
        branches: principalDetails.branches || [],
        warehouses: principalDetails.warehouses || [],
      });
      return;
    }
  }
}
