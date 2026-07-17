export abstract class DomainException extends Error {
  protected constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidSubscriptionStateException extends DomainException {
  constructor(currentState: string, targetState: string) {
    super(
      'INVALID_SUBSCRIPTION_STATE',
      `Cannot transition subscription from ${currentState} to ${targetState}.`,
    );
  }
}

export class InvalidPlanStateException extends DomainException {
  constructor(currentState: string, targetState: string) {
    super(
      'INVALID_PLAN_STATE',
      `Cannot transition subscription plan from ${currentState} to ${targetState}.`,
    );
  }
}

export class PlanArchivedException extends DomainException {
  constructor(planId: string) {
    super(
      'PLAN_ARCHIVED',
      `Subscription plan ${planId} is archived and cannot be subscribed to.`,
    );
  }
}

export class TenantAlreadySubscribedException extends DomainException {
  constructor(tenantId: string) {
    super(
      'TENANT_ALREADY_SUBSCRIBED',
      `Tenant ${tenantId} already has an active subscription.`,
    );
  }
}
