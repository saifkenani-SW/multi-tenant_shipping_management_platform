import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { TransactionalPrismaService } from '../../../../../packages/transaction';

export interface CreatePaymentData {
  tenantId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  collectedByEmployeeId: string | null;
  organizationUnitId: string | null;
  transactionReference: string | null;
  status: PaymentStatus;
}

/**
 * Payments are immutable financial history: this repository inserts and nothing
 * else. There is deliberately no update or delete — correcting a payment means
 * recording another one.
 */
@Injectable()
export class PaymentCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreatePaymentData): Promise<{ id: string }> {
    return this.prisma.client.payment.create({
      data: {
        tenant_id: data.tenantId,
        invoice_id: data.invoiceId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        collected_by_employee_id: data.collectedByEmployeeId,
        organization_unit_id: data.organizationUnitId,
        transaction_reference: data.transactionReference,
        status: data.status,
      },
      select: { id: true },
    });
  }
}
