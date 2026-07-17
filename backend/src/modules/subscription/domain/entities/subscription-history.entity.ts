export interface SubscriptionHistoryProps {
  id: string;
  tenantSubscriptionId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  recordedAt: Date;
}

export class SubscriptionHistory {
  private constructor(private readonly props: SubscriptionHistoryProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get tenantSubscriptionId(): string {
    return this.props.tenantSubscriptionId;
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

  public get recordedAt(): Date {
    return this.props.recordedAt;
  }

  public static create(
    id: string,
    tenantSubscriptionId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): SubscriptionHistory {
    return new SubscriptionHistory({
      id,
      tenantSubscriptionId,
      planId,
      startDate,
      endDate,
      recordedAt: new Date(),
    });
  }

  public static reconstitute(
    props: SubscriptionHistoryProps,
  ): SubscriptionHistory {
    return new SubscriptionHistory(props);
  }
}
