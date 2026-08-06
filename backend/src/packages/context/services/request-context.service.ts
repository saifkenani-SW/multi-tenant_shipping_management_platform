import { Injectable } from '@nestjs/common';
import { AsyncContextProvider } from '../providers/async-context.provider';
import { RequestContext } from '../interfaces/request-context.interface';
import { Principal } from '../principal/principal/Principal';

@Injectable()
export class RequestContextService {
  constructor(private readonly contextProvider: AsyncContextProvider) {}

  update(values: Partial<RequestContext>): void {
    const context = this.get();

    if (!context) {
      return;
    }

    Object.assign(context, values);
  }

  get(): RequestContext | undefined {
    return this.contextProvider.get();
  }

  getRequestId(): string | undefined {
    return this.get()?.requestId;
  }

  getCorrelationId(): string | undefined {
    return this.get()?.correlationId;
  }

  getTraceId(): string | undefined {
    return this.get()?.traceId;
  }

  public getPrincipal(): Principal {
    const context = this.get();

    if (!context?.principal) {
      throw new Error(
        'Principal is not available in the current request context.',
      );
    }

    return context.principal;
  }

  public getTenantId(): string | undefined {
    return this.getPrincipal().tenantId;
  }

  public getTenantIdOrThrow(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant ID is missing from the current request context.');
    }
    return tenantId;
  }

  setTraceId(traceId: string): void {
    const context = this.get();

    if (context) {
      context.traceId = traceId;
    }
  }

  public setPrincipal(principal: Principal): void {
    const context = this.get();

    if (context) {
      context.principal = principal;
    }
  }
}
