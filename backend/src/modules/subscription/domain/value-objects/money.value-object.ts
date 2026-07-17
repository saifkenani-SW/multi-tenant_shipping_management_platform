export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!currency || currency.trim() === '') {
      throw new Error('Currency must be specified');
    }
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
