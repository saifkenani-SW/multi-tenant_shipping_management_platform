import { TenantSubscriptionStatus } from '../value-objects/subscription.enums';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { InvalidSubscriptionStateException } from '../exceptions/subscription.exceptions';

export interface TenantSubscriptionProps {
  id: string;
  tenantId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  status: TenantSubscriptionStatus;
  history: SubscriptionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export class TenantSubscription {
  private constructor(private readonly props: TenantSubscriptionProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get tenantId(): string {
    return this.props.tenantId;
  }

  public get planId(): string {
    return this.props.planId;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date {
    return this.props.endDate;
  }

  public get status(): TenantSubscriptionStatus {
    return this.props.status;
  }

  public get history(): ReadonlyArray<SubscriptionHistory> {
    return Object.freeze([...this.props.history]);
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static subscribe(
    id: string,
    tenantId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
    historyId: string,
  ): TenantSubscription {
    const historyRecord = SubscriptionHistory.create(
      historyId,
      id,
      planId,
      startDate,
      endDate,
    );

    return new TenantSubscription({
      id,
      tenantId,
      planId,
      startDate,
      endDate,
      status: TenantSubscriptionStatus.ACTIVE,
      history: [historyRecord],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(
    props: TenantSubscriptionProps,
  ): TenantSubscription {
    return new TenantSubscription(props);
  }

  public suspend(): void {
    if (this.props.status !== TenantSubscriptionStatus.ACTIVE) {
      throw new InvalidSubscriptionStateException(
        this.props.status,
        TenantSubscriptionStatus.SUSPENDED,
      );
    }

    this.props.status = TenantSubscriptionStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    if (this.props.status !== TenantSubscriptionStatus.SUSPENDED) {
      throw new InvalidSubscriptionStateException(
        this.props.status,
        TenantSubscriptionStatus.ACTIVE,
      );
    }

    this.props.status = TenantSubscriptionStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (
      this.props.status === TenantSubscriptionStatus.CANCELLED ||
      this.props.status === TenantSubscriptionStatus.EXPIRED
    ) {
      throw new InvalidSubscriptionStateException(
        this.props.status,
        TenantSubscriptionStatus.CANCELLED,
      );
    }

    this.props.status = TenantSubscriptionStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public expire(): void {
    if (
      this.props.status !== TenantSubscriptionStatus.ACTIVE &&
      this.props.status !== TenantSubscriptionStatus.SUSPENDED
    ) {
      throw new InvalidSubscriptionStateException(
        this.props.status,
        TenantSubscriptionStatus.EXPIRED,
      );
    }

    this.props.status = TenantSubscriptionStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }

  public renew(newEndDate: Date, historyId: string): void {
    if (this.props.status !== TenantSubscriptionStatus.ACTIVE) {
      throw new InvalidSubscriptionStateException(this.props.status, 'RENEW');
    }

    if (newEndDate <= this.props.endDate) {
      throw new Error('New end date must be after current end date');
    }

    const historyRecord = SubscriptionHistory.create(
      historyId,
      this.props.id,
      this.props.planId,
      this.props.endDate, // Renewal starts when previous ends
      newEndDate,
    );

    this.props.endDate = newEndDate;
    this.props.history.push(historyRecord);
    this.props.updatedAt = new Date();
  }

  public changePlan(
    newPlanId: string,
    newEndDate: Date,
    historyId: string,
  ): void {
    if (this.props.status !== TenantSubscriptionStatus.ACTIVE) {
      throw new InvalidSubscriptionStateException(
        this.props.status,
        'CHANGE_PLAN',
      );
    }

    const now = new Date();

    const historyRecord = SubscriptionHistory.create(
      historyId,
      this.props.id,
      newPlanId,
      now,
      newEndDate,
    );

    this.props.planId = newPlanId;
    // Current period stops now, new period starts now
    this.props.startDate = now;
    this.props.endDate = newEndDate;
    this.props.history.push(historyRecord);
    this.props.updatedAt = now;
  }
}
