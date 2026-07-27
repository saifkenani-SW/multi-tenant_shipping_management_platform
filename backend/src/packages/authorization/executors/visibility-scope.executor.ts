import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AUTHORIZATION_CONTEXT_PROVIDER } from '../tokens';
import type { AuthorizationContextProvider } from '../contracts';
import { ScopeOptions, VisibilityScopeBuilder } from '../contracts';

@Injectable()
export class VisibilityScopeExecutor {
  constructor(
    private readonly moduleRef: ModuleRef,

    @Inject(AUTHORIZATION_CONTEXT_PROVIDER)
    private readonly contextProvider: AuthorizationContextProvider,
  ) {}

  buildScope<TScope>(options: ScopeOptions<TScope>): TScope {
    const context = this.contextProvider.getContext();

    const policy = this.moduleRef.get(options.builder, {
      strict: false,
    }) as VisibilityScopeBuilder<TScope>;

    return policy.buildScope(context);
  }
}
