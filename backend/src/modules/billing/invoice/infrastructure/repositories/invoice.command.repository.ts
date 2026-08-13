import { ConflictException, Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentResponsibility } from '@prisma/client';
import { TransactionalPrismaService } from '../../../../../packages/transaction';

export interface CreateInvoiceData {
  tenantId: string;
  customerProfileId: string;
  customerShipmentId: string | null;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  invoiceNumber: string;
  subtotal: number;
  handlingFees: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentResponsibility: PaymentResponsibility;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
}

@Injectable()
export class InvoiceCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateInvoiceData): Promise<{ id: string }> {
    return this.prisma.client.invoice.create({
      data: {
        tenant_id: data.tenantId,
        customer_profile_id: data.customerProfileId,
        customer_shipment_id: data.customerShipmentId,
        origin_org_unit_id: data.originOrgUnitId,
        destination_org_unit_id: data.destinationOrgUnitId,
        invoice_number: data.invoiceNumber,
        subtotal: data.subtotal,
        handling_fees: data.handlingFees,
        tax_amount: data.taxAmount,
        discount_amount: data.discountAmount,
        total_amount: data.totalAmount,
        payment_responsibility: data.paymentResponsibility,
        currency: data.currency,
        status: data.status,
        due_date: data.dueDate,
      },
      select: { id: true },
    });
  }

  /**
   * Takes the next running number for a tenant and year.
   *
   * One atomic upsert: two requests arriving together are serialised by the
   * primary key, so neither can read the same number. Because it runs inside
   * the caller transaction, an invoice that fails to save also gives its
   * number back, which keeps the sequence gapless the way accounting expects.
   */
  async nextSequenceNumber(tenantId: string, year: number): Promise<number> {
    const rows = await this.prisma.client.$queryRaw<{ last_number: number }[]>`
      INSERT INTO "invoice_counter" ("tenant_id", "year", "last_number", "updated_at")
      VALUES (${tenantId}::uuid, ${year}, 1, NOW())
      ON CONFLICT ("tenant_id", "year")
      DO UPDATE SET "last_number" = "invoice_counter"."last_number" + 1,
                    "updated_at" = NOW()
      RETURNING "last_number"
    `;

    const next = rows[0]?.last_number;

    if (!next) {
      throw new ConflictException(
        'Could not allocate an invoice number. Please retry.',
      );
    }

    return next;
  }

  /**
   * Persists a status the aggregate already approved, guarded by the version it
   * was loaded with. A concurrent payment bumps that version, this WHERE stops
   * matching, and the caller is told to retry rather than losing the other
   * payment.
   */
  async updateStatus(
    invoiceId: string,
    status: InvoiceStatus,
    currentVersion: number,
  ): Promise<void> {
    const result = await this.prisma.client.invoice.updateMany({
      where: { id: invoiceId, version: currentVersion },
      data: { status, version: { increment: 1 } },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Invoice was modified by another process. Please retry.',
      );
    }
  }

  /**
   * Moves every unpaid invoice past its due date to OVERDUE, for the scheduled
   * sweep. Done in one statement rather than row by row: the sweep touches many
   * invoices across many tenants and nothing about it needs per-row reasoning.
   */
  async markOverdueBefore(now: Date): Promise<number> {
    const result = await this.prisma.client.invoice.updateMany({
      where: {
        due_date: { not: null, lt: now },
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID] },
      },
      data: { status: InvoiceStatus.OVERDUE, version: { increment: 1 } },
    });

    return result.count;
  }
}
