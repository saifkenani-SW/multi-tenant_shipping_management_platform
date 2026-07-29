import { AuthorizationExpression } from './authorization-expression.type';

export interface AuthorizeOptions<TPayload = unknown> {
  readonly policy: AuthorizationExpression;

  readonly payloadResolver?: (...args: unknown[]) => TPayload;
}
