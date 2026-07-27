import { Injectable } from '@nestjs/common';
import {
  AuthorizationContext,
  AuthorizationContextProvider,
} from '../contracts';
import { RequestContextService } from '../../context/services/request-context.service';
import { Principal } from '../../context/principal/principal/Principal';

@Injectable()
export class ContextAuthorizationProvider implements AuthorizationContextProvider {
  constructor(private readonly requestContext: RequestContextService) {}

  getContext(): AuthorizationContext<Principal> {
    return {
      principal: this.requestContext.getPrincipal(),
    };
  }
}
