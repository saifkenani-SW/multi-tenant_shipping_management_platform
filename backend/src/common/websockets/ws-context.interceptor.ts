import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { Observable } from 'rxjs';

import { AsyncContextProvider } from '../../packages/context/providers/async-context.provider';
import { RequestContextService } from '../../packages/context/services/request-context.service';
import { SubjectType } from '../../packages/context/principal/principal/SubjectType';
import { UserLoginType } from '../../modules/auth/types/auth.types';
import { CustomerFacade } from '../../modules/customer/facades/customer.facade';
import { EmployeeFacade } from '../../modules/employee/facades/employee.facade';
import { generateUuid } from '../uuid';

/**
 * Sets up the AsyncLocalStorage context and populates the Principal for every
 * incoming WebSocket message, mirroring what ContextMiddleware + GlobalAuthGuard
 * do for HTTP requests.
 *
 * Token must be sent in socket.handshake.auth.token.
 * The interceptor is designed to be applied at the message-handler level so
 * that each event gets its own isolated context, exactly like an HTTP request.
 */
@Injectable()
export class WsContextInterceptor implements NestInterceptor {
  constructor(
    private readonly asyncContextProvider: AsyncContextProvider,
    private readonly requestContextService: RequestContextService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient<Socket>();
    const token: string | undefined = client.handshake.auth?.token;

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new WsException('Invalid or expired authentication token');
    }

    /*
     * Wrap the entire handler execution inside asyncContextProvider.run() so
     * that RequestContextService (and therefore @Authorize) can read the
     * principal throughout the async call chain — identical to how
     * ContextMiddleware works for HTTP.
     */
    return new Observable((subscriber) => {
      this.asyncContextProvider.run(
        { requestId: generateUuid() },
        async () => {
          try {
            await this.populatePrincipal(payload);
            next.handle().subscribe(subscriber);
          } catch (err) {
            subscriber.error(err);
          }
        },
      );
    });
  }

  private async populatePrincipal(user: any): Promise<void> {
    if (user.type === UserLoginType.PLATFORM_OWNER) {
      this.requestContextService.setPrincipal({
        subject: { id: user.sub, type: SubjectType.PLATFORM_OWNER },
        branches: [],
        warehouses: [],
      });
      return;
    }

    if (user.type === UserLoginType.CUSTOMER) {
      const customerFacade = this.moduleRef.get(CustomerFacade, {
        strict: false,
      });
      const customer = await customerFacade.getProfileByUserId(user.sub);

      this.requestContextService.setPrincipal({
        subject: { id: user.sub, type: SubjectType.CUSTOMER },
        profileId: user.profileId,
        phone: customer?.phone ?? undefined,
        branches: [],
        warehouses: [],
      });
      return;
    }

    if (user.type === UserLoginType.TENANT_ADMIN) {
      this.requestContextService.setPrincipal({
        subject: { id: user.sub, type: SubjectType.TENANT_ADMIN },
        tenantId: user.tenantId,
        branches: [],
        warehouses: [],
      });
      return;
    }

    if (user.type === UserLoginType.DRIVER) {
      this.requestContextService.setPrincipal({
        subject: { id: user.sub, type: SubjectType.DRIVER },
        tenantId: user.tenantId,
        profileId: user.profileId,
        vehicleId: user.vehicleId,
        branches: [],
        warehouses: [],
      });
      return;
    }

    if (user.type === UserLoginType.EMPLOYEE) {
      const employeeFacade = this.moduleRef.get(EmployeeFacade, {
        strict: false,
      });
      const principalDetails = await employeeFacade.getPrincipalByUserId(
        user.sub,
        user.tenantId,
      );

      if (!principalDetails) {
        throw new WsException(
          'Employee assignments not found or deactivated',
        );
      }

      this.requestContextService.setPrincipal({
        subject: { id: user.sub, type: SubjectType.EMPLOYEE },
        tenantId: user.tenantId,
        profileId: user.profileId,
        branches: principalDetails.branches || [],
        warehouses: principalDetails.warehouses || [],
      });
      return;
    }

    throw new WsException('Unknown user type');
  }
}
