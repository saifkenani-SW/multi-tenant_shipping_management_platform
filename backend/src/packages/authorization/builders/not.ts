import {
  AuthorizationExpression,
  NotExpression,
} from '../contracts/authorization-expression.type';

export function Not(expression: AuthorizationExpression): NotExpression {
  return {
    type: 'not',
    expression,
  };
}
