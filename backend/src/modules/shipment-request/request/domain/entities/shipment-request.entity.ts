import { RequestStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export class ShipmentRequest {
  constructor(
    public readonly id: string,
    public status: RequestStatus,
    public approvedQuotationId?: string,
  ) {}

  acceptQuotation(quotationId: string): void {
    if (this.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept quotation. Current status is ${this.status}, expected ${RequestStatus.PENDING}`,
      );
    }
    this.status = RequestStatus.CUSTOMER_APPROVED;
    this.approvedQuotationId = quotationId;
  }

  acceptByCompany(): void {
    if (this.status !== RequestStatus.CUSTOMER_APPROVED) {
      throw new BadRequestException(
        `Cannot accept by company. Current status is ${this.status}, expected ${RequestStatus.CUSTOMER_APPROVED}`,
      );
    }
    this.status = RequestStatus.COMPANY_ACCEPTED;
  }

  cancel(): void {
    // TODO: Add cancellation rules (e.g. penalty fees if cancelled too late, check if already in progress)
    if (
      this.status === RequestStatus.CANCELLED ||
      this.status === RequestStatus.CONVERTED ||
      this.status === RequestStatus.REJECTED ||
      this.status === RequestStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Cannot cancel request. Current status is ${this.status}`,
      );
    }
    this.status = RequestStatus.CANCELLED;
  }

  rejectByCompany(): void {
    if (
      this.status === RequestStatus.CANCELLED ||
      this.status === RequestStatus.CONVERTED ||
      this.status === RequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot reject request. Current status is ${this.status}`,
      );
    }
    this.status = RequestStatus.REJECTED;
  }

  convert(): void {
    if (this.status !== RequestStatus.COMPANY_ACCEPTED) {
      throw new BadRequestException(
        `Cannot convert request to shipment. Current status is ${this.status}, expected ${RequestStatus.COMPANY_ACCEPTED}`,
      );
    }
    this.status = RequestStatus.CONVERTED;
  }
}
