import { Injectable } from '@nestjs/common';
import {
  AuthorizeOptions,
  CapabilitiesOptions,
  ScopeOptions,
} from '../contracts';
import  { VisibilityScopeExecutor } from '../executors/visibility-scope.executor';
import { AuthorizationExecutor } from '../executors/authorization.executor';
import { CapabilityExecutor } from '../executors/capability.executor';

@Injectable()
export class AuthorizationFacade {
  constructor(
    private readonly authorizationExecutor: AuthorizationExecutor,
    private readonly visibilityScopeExecutor: VisibilityScopeExecutor,
    private readonly capabilityExecutor: CapabilityExecutor,
  ) {}

  authorize<TPayload>(
    options: AuthorizeOptions<TPayload>,
    payload?: TPayload,
  ): Promise<void> {
    return this.authorizationExecutor.authorize(options, payload);
  }

  buildScope<TScope>(options: ScopeOptions<TScope>): TScope {
    return this.visibilityScopeExecutor.buildScope(options);
  }

  buildCapabilities<TEntity, TCapability>(
    entity: TEntity,
    options: CapabilitiesOptions<TEntity, TCapability>,
  ): Promise<TCapability> {
    return this.capabilityExecutor.buildCapabilities(entity, options);
  }
}
