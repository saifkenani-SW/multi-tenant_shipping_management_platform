import { Global, Module } from '@nestjs/common';
import { ContextModule } from '../../context/context.module';
import { AUTHORIZATION_CONTEXT_PROVIDER } from '../tokens';
import { ContextAuthorizationProvider } from '../providers/context-authorization.provider';
import { AuthorizationFacade } from '../facade/authorization.facade';
import {
  AuthorizationExecutor,
  CapabilityExecutor,
  VisibilityScopeExecutor,
} from '../executors';

@Global()
@Module({
  imports: [ContextModule],
  providers: [
    ContextAuthorizationProvider,
    {
      provide: AUTHORIZATION_CONTEXT_PROVIDER,
      useExisting: ContextAuthorizationProvider,
    },
    AuthorizationExecutor,

    VisibilityScopeExecutor,

    CapabilityExecutor,

    AuthorizationFacade,
  ],

  exports: [
    AuthorizationFacade,
    ContextAuthorizationProvider,
    AUTHORIZATION_CONTEXT_PROVIDER,
  ],
})
export class AuthorizationModule {}
