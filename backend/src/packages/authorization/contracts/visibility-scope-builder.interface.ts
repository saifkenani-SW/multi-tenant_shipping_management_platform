import { AuthorizationContext } from './authorization-context.interface';

export interface VisibilityScopeBuilder<TScope> {
  buildScope(context: AuthorizationContext): TScope;
}
