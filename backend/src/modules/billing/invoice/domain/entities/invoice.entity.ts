import { ConflictException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';

export interface InvoiceSnapshot {
  id: string;
  version: number;
  tenantId: string;
  customerShipmentId: string | null;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  invoiceNumber: string;
  subtotal: number;
  handlingFees: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentResponsibility: string;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transitions the invoice lifecycle allows.
 *
 * PAID is not terminal in the schema sense — a refund workflow could reopen it
 * later — but nothing in this module moves an invoice out of PAID today, so it
 * is treated as final here and the door is left closed rather than half open.
 */
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.UNPAID]: [
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.PARTIALLY_PAID]: [
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
  ],
  // An overdue invoice is still owed: paying it is exactly what should happen.
  [InvoiceStatus.OVERDUE]: [
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.CANCELLED]: [],
};

/**
 * Invoice aggregate root.
 *
 * Owns its own lifecycle and the arithmetic that decides it. Concurrency is
 * guarded by `version`: the repository writes only while the stored version
 * still matches the one this aggregate was loaded with, so two payments taken
 * at two counters at the same moment cannot overwrite each other.
 *
 * The invoice belongs to a shipment, not to a customer account. Its parties are
 * recorded as the sender and receiver names and phones copied from the shipment
 * at the moment it was billed. Most senders walk into a branch and pay there
 * without ever holding an account, so requiring a registered customer would
 * have made the common case unbillable. Copying rather than referencing also
 * means a later edit to someone's profile cannot silently rewrite what an
 * issued invoice says.
 */
export class Invoice {
  private constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly tenantId: string,
    public readonly customerShipmentId: string | null,
    public readonly senderName: string,
    public readonly senderPhone: string,
    public readonly receiverName: string,
    public readonly receiverPhone: string,
    public readonly originOrgUnitId: string,
    public readonly destinationOrgUnitId: string,
    public readonly invoiceNumber: string,
    public readonly subtotal: number,
    public readonly handlingFees: number,
    public readonly taxAmount: number,
    public readonly discountAmount: number,
    public readonly totalAmount: number,
    public readonly paymentResponsibility: string,
    public readonly currency: string,
    private _status: InvoiceStatus,
    public readonly dueDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get status(): InvoiceStatus {
    return this._status;
  }

  static restore(snapshot: InvoiceSnapshot): Invoice {
    return new Invoice(
      snapshot.id,
      snapshot.version,
      snapshot.tenantId,
      snapshot.customerShipmentId,
      snapshot.senderName,
      snapshot.senderPhone,
      snapshot.receiverName,
      snapshot.receiverPhone,
      snapshot.originOrgUnitId,
      snapshot.destinationOrgUnitId,
      snapshot.invoiceNumber,
      snapshot.subtotal,
      snapshot.handlingFees,
      snapshot.taxAmount,
      snapshot.discountAmount,
      snapshot.totalAmount,
      snapshot.paymentResponsibility,
      snapshot.currency,
      snapshot.status,
      snapshot.dueDate,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  /**
   * The money an invoice is worth. Kept here rather than in a service so the
   * arithmetic that defines the total lives with the aggregate that owns it.
   */
  static calculateTotal(parts: {
    subtotal: number;
    handlingFees: number;
    taxAmount: number;
    discountAmount: number;
  }): number {
    const total =
      parts.subtotal +
      parts.handlingFees +
      parts.taxAmount -
      parts.discountAmount;

    if (total < 0) {
      throw new ConflictException(
        'Invoice total cannot be negative. Check the discount against the amount.',
      );
    }

    return Math.round(total * 100) / 100;
  }

  private transitionTo(target: InvoiceStatus): void {
    if (target === this._status) {
      return;
    }

    if (!ALLOWED_TRANSITIONS[this._status].includes(target)) {
      throw new ConflictException(
        `Invoice cannot move from ${this._status} to ${target}.`,
      );
    }

    this._status = target;
  }

  /**
   * Re-derives the status from what has actually been collected, and returns
   * the new status when it changed so the caller knows whether to persist.
   *
   * Rounding to two decimals before comparing keeps a payment that exactly
   * settles an invoice from being read as a few millionths short.
   */
  applyPaidTotal(paidTotal: number): InvoiceStatus | null {
    const paid = Math.round(paidTotal * 100) / 100;
    const owed = Math.round(this.totalAmount * 100) / 100;

    let target: InvoiceStatus;

    if (paid >= owed) {
      target = InvoiceStatus.PAID;
    } else if (paid > 0) {
      target = InvoiceStatus.PARTIALLY_PAID;
    } else {
      // Nothing collected: an already overdue invoice stays overdue.
      target =
        this._status === InvoiceStatus.OVERDUE
          ? InvoiceStatus.OVERDUE
          : InvoiceStatus.UNPAID;
    }

    if (target === this._status) {
      return null;
    }

    this.transitionTo(target);
    return target;
  }

  /** Cancelled alongside the shipment it belongs to. */
  cancel(): void {
    this.transitionTo(InvoiceStatus.CANCELLED);
  }

  /** Marked overdue by the scheduled sweep once the due date has passed. */
  markOverdue(): void {
    this.transitionTo(InvoiceStatus.OVERDUE);
  }

  /** A settled or cancelled invoice takes no further payments. */
  assertAcceptsPayment(): void {
    if (this._status === InvoiceStatus.PAID) {
      throw new ConflictException('Invoice is already fully paid.');
    }

    if (this._status === InvoiceStatus.CANCELLED) {
      throw new ConflictException('Invoice has been cancelled.');
    }
  }

  isSettled(): boolean {
    return (
      this._status === InvoiceStatus.PAID ||
      this._status === InvoiceStatus.CANCELLED
    );
  }
}
