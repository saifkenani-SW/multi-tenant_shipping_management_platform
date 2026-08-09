import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction/services/transactional-prisma.service';
import { GeneratedQuotation } from '../../application/services/quotation-generation.service';
import { QuotationStatus, ServiceLevel, QuotationType } from '@prisma/client';

@Injectable()
export class QuotationCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async createMany(quotations: GeneratedQuotation[]): Promise<number> {
    if (quotations.length === 0) return 0;

    const result = await this.prisma.client.quotation.createMany({
      data: quotations.map((q) => ({
        id: q.id,
        tenant_id: q.tenantId,
        shipment_request_id: q.shipmentRequestId,
        origin_org_unit_id: q.originOrgUnitId,
        destination_org_unit_id: q.destinationOrgUnitId,
        service_level: q.serviceLevel as ServiceLevel,
        quotation_type: q.quotationType as QuotationType,
        base_price: q.basePrice,
        weight_charge: q.weightCharge,
        extra_fees: q.extraFees,
        amount: q.amount ?? 0,
        pricing_snapshot: q.pricingSnapshot ?? undefined,
        status: QuotationStatus.PENDING,
      })),
    });

    return result.count;
  }

  async updateStatus(id: string, status: QuotationStatus): Promise<void> {
    await this.prisma.client.quotation.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }

  async rejectOtherQuotations(
    shipmentRequestId: string,
    acceptedQuotationId: string,
  ): Promise<void> {
    await this.prisma.client.quotation.updateMany({
      where: {
        shipment_request_id: shipmentRequestId,
        id: { not: acceptedQuotationId },
        status: { notIn: [QuotationStatus.REJECTED, QuotationStatus.EXPIRED] },
      },
      data: { status: QuotationStatus.REJECTED, updated_at: new Date() },
    });
  }

  async submitPrice(
    id: string,
    prices: {
      amount: number;
      basePrice?: number;
      weightCharge?: number;
      extraFees?: number;
    },
    status: QuotationStatus,
    submittedByEmployeeId: string | null,
  ): Promise<void> {
    await this.prisma.client.quotation.update({
      where: { id },
      data: {
        amount: prices.amount,
        base_price: prices.basePrice,
        weight_charge: prices.weightCharge,
        extra_fees: prices.extraFees,
        status,
        submitted_by_employee_id: submittedByEmployeeId,
        updated_at: new Date(),
      },
    });
  }
}
