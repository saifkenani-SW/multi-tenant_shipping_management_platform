import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type {
  AuthorizationContextProvider,
  CapabilitiesOptions,
  CapabilityBuilder,
} from '../contracts';
import { AUTHORIZATION_CONTEXT_PROVIDER } from '../tokens';

@Injectable()
export class CapabilityExecutor {
  constructor(
    private readonly moduleRef: ModuleRef,

    @Inject(AUTHORIZATION_CONTEXT_PROVIDER)
    private readonly contextProvider: AuthorizationContextProvider,
  ) {}

  async buildCapabilities<TEntity, TCapability>(
    entity: TEntity,
    options: CapabilitiesOptions<TEntity, TCapability>,
  ): Promise<TCapability> {
    const context = this.contextProvider.getContext();

    const policy = this.moduleRef.get(options.policy, {
      strict: false,
    }) as CapabilityBuilder<TEntity, TCapability>;

    return await policy.buildCapabilities(entity, context);
  }
}
