import { QuotationStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export class Quotation {
  constructor(
    public readonly id: string,
    public readonly shipmentRequestId: string,
    public status: QuotationStatus,
    public readonly quotationType: 'AUTOMATIC' | 'MANUAL' = 'MANUAL',
  ) {}

  approve(): void {
    if (this.status !== QuotationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve quotation. Current status is ${this.status}, expected ${QuotationStatus.PENDING}`,
      );
    }
    this.status = QuotationStatus.APPROVED;
  }

  requestManualPrice(): void {
    if (this.quotationType !== 'MANUAL') {
      throw new BadRequestException(
        'Cannot request manual pricing for an automatic quotation.',
      );
    }
    if (this.status !== QuotationStatus.WAITING_PRICING_REQUEST) {
      throw new BadRequestException(
        `Cannot request manual pricing. Current status is ${this.status}, expected ${QuotationStatus.WAITING_PRICING_REQUEST}`,
      );
    }
    this.status = QuotationStatus.WAITING_PRICING;
  }

  submitPrice(
    amount: number,
    basePrice?: number,
    weightCharge?: number,
    extraFees?: number,
  ): void {
    if (this.quotationType !== 'MANUAL') {
      throw new BadRequestException(
        'Cannot submit price for an automatic quotation.',
      );
    }
    if (this.status !== QuotationStatus.WAITING_PRICING) {
      throw new BadRequestException(
        `Cannot submit price. Current status is ${this.status}, expected ${QuotationStatus.WAITING_PRICING}`,
      );
    }
    if (amount <= 0) {
      throw new BadRequestException(
        'Quotation amount must be greater than zero.',
      );
    }

    const hasComponents =
      basePrice !== undefined ||
      weightCharge !== undefined ||
      extraFees !== undefined;

    if (hasComponents) {
      const sum = (basePrice || 0) + (weightCharge || 0) + (extraFees || 0);
      if (Math.abs(amount - sum) > 0.001) {
        throw new BadRequestException(
          'The sum of basePrice, weightCharge, and extraFees must equal the total amount.',
        );
      }
    }

    this.status = QuotationStatus.PENDING;
  }
}
