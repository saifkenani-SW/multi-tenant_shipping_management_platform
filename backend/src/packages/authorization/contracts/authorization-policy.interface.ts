import { AuthorizationContext } from './authorization-context.interface';

export interface AuthorizationPolicy<TAction, TPayload = unknown> {
  authorize(
    action: TAction,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void>;
}
