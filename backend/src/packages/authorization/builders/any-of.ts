import {
  AnyOfExpression,
  AuthorizationExpression,
} from '../contracts/authorization-expression.type';

export function AnyOf(
  ...expressions: AuthorizationExpression[]
): AnyOfExpression {
  return {
    type: 'any',
    expressions,
  };
}
