import { AuthorizationContext } from './authorization-context.interface';

export interface AuthorizationContextProvider<TPrincipal = unknown> {
  getContext(): AuthorizationContext<TPrincipal>;
}
