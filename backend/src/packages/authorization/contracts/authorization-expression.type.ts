import { PolicyExpression } from './policy-expression.type';

export type AuthorizationExpression<TAction = unknown> =
  | PolicyExpression<TAction>
  | AnyOfExpression<TAction>
  | AllOfExpression<TAction>
  | NotExpression<TAction>;

export interface AnyOfExpression<TAction = unknown> {
  readonly type: 'any';

  readonly expressions: AuthorizationExpression<TAction>[];
}

export interface AllOfExpression<TAction = unknown> {
  readonly type: 'all';

  readonly mode: 'sequential' | 'parallel';

  readonly expressions: AuthorizationExpression<TAction>[];
}

export interface NotExpression<TAction = unknown> {
  readonly type: 'not';

  readonly expression: AuthorizationExpression<TAction>;
}
