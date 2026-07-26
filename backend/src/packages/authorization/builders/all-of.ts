import {
  AllOfExpression,
  AuthorizationExpression,
} from '../contracts/authorization-expression.type';

export const AllOf = {
  sequential(...expressions: AuthorizationExpression[]): AllOfExpression {
    return {
      type: 'all',
      mode: 'sequential',
      expressions,
    };
  },

  parallel(...expressions: AuthorizationExpression[]): AllOfExpression {
    return {
      type: 'all',
      mode: 'parallel',
      expressions,
    };
  },
} as const;
