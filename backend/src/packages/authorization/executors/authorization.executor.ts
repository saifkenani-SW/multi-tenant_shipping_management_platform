import type {
  AuthorizationContext,
  AuthorizationContextProvider,
  AuthorizationPolicy,
  AuthorizeOptions,
} from '../contracts';

import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { AUTHORIZATION_CONTEXT_PROVIDER } from '../tokens';
import { AccessDeniedException } from '../exceptions';

import {
  AllOfExpression,
  AnyOfExpression,
  AuthorizationExpression,
  NotExpression,
} from '../contracts/authorization-expression.type';

import { PolicyExpression } from '../contracts/policy-expression.type';

@Injectable()
export class AuthorizationExecutor {
  constructor(
    private readonly moduleRef: ModuleRef,

    @Inject(AUTHORIZATION_CONTEXT_PROVIDER)
    private readonly contextProvider: AuthorizationContextProvider,
  ) {}

  async authorize<TPayload = unknown>(
    options: AuthorizeOptions<TPayload>,
    payload?: TPayload,
  ): Promise<void> {
    const context = this.contextProvider.getContext();

    await this.executeExpression(options.policy, context, payload);
  }

  // ============================================================
  // Authorization Expression
  // ============================================================

  private async executeExpression<TPayload>(
    expression: AuthorizationExpression,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void> {
    switch (expression.type) {
      case 'policy':
        return this.executePolicy(expression, context, payload);

      case 'any':
        return this.executeAny(expression, context, payload);

      case 'all':
        return this.executeAll(expression, context, payload);

      case 'not':
        return this.executeNot(expression, context, payload);
    }
  }

  private async executePolicy<TAction, TPayload>(
    expression: PolicyExpression<TAction, TPayload>,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void> {
    const policy = this.moduleRef.get(expression.policy, {
      strict: false,
    }) as AuthorizationPolicy<TAction, TPayload>;

    await policy.authorize(expression.action, context, payload);
  }

  private async executeAny<TPayload>(
    expression: AnyOfExpression,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void> {
    let lastError: unknown;

    for (const child of expression.expressions) {
      try {
        await this.executeExpression(child, context, payload);

        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new AccessDeniedException();
  }

  private async executeAll<TPayload>(
    expression: AllOfExpression,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void> {
    if (expression.mode === 'parallel') {
      await Promise.all(
        expression.expressions.map((child) =>
          this.executeExpression(child, context, payload),
        ),
      );

      return;
    }

    for (const child of expression.expressions) {
      await this.executeExpression(child, context, payload);
    }
  }

  private async executeNot<TPayload>(
    expression: NotExpression,
    context: AuthorizationContext,
    payload?: TPayload,
  ): Promise<void> {
    try {
      await this.executeExpression(expression.expression, context, payload);
    } catch (error) {
      if (error instanceof AccessDeniedException) {
        return;
      }

      throw error;
    }

    throw new AccessDeniedException();
  }
}
