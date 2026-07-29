import { Type } from '@nestjs/common';
import { AuthorizationPolicy } from './contracts';
import { PolicyExpression } from './contracts/policy-expression.type';

export function Policy<TAction, TPayload = unknown>(
  policy: Type<AuthorizationPolicy<TAction, TPayload>>,
  action: TAction,
): PolicyExpression<TAction, TPayload> {
  return {
    type: 'policy',
    policy,
    action,
  };
}
