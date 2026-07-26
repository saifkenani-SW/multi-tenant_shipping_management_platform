import { Type } from '@nestjs/common';
import { AuthorizationPolicy } from './authorization-policy.interface';

export interface PolicyExpression<TAction = unknown, TPayload = unknown> {
  readonly type: 'policy';

  readonly policy: Type<AuthorizationPolicy<TAction, TPayload>>;

  readonly action: TAction;
}
