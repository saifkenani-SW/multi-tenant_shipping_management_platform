import { Money } from '../value-objects/money.value-object';
import {
  BillingCycle,
  SubscriptionPlanStatus,
} from '../value-objects/subscription.enums';
import { InvalidPlanStateException } from '../exceptions/subscription.exceptions';

export interface SubscriptionPlanProps {
  id: string;
  name: string;
  price: Money;
  billingCycle: BillingCycle;
  features: string[];
  status: SubscriptionPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionPlan {
  private constructor(private readonly props: SubscriptionPlanProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get price(): Money {
    return this.props.price;
  }

  public get billingCycle(): BillingCycle {
    return this.props.billingCycle;
  }

  public get features(): ReadonlyArray<string> {
    return Object.freeze([...this.props.features]);
  }

  public get status(): SubscriptionPlanStatus {
    return this.props.status;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    id: string,
    name: string,
    price: Money,
    billingCycle: BillingCycle,
    features: string[],
  ): SubscriptionPlan {
    return new SubscriptionPlan({
      id,
      name,
      price,
      billingCycle,
      features,
      status: SubscriptionPlanStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: SubscriptionPlanProps): SubscriptionPlan {
    return new SubscriptionPlan(props);
  }

  public archive(): void {
    if (this.props.status === SubscriptionPlanStatus.ARCHIVED) {
      return; // Idempotent
    }

    this.props.status = SubscriptionPlanStatus.ARCHIVED;
    this.props.updatedAt = new Date();
  }
}
