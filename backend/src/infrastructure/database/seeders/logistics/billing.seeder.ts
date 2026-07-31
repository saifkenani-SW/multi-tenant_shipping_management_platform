import { Injectable, Logger } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class BillingSeeder implements Seeder {
  private readonly logger = new Logger(BillingSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting BillingSeeder...');

    const tenant1 = SEEDED_TENANTS[0];
    const shipment = await this.prisma.customer_shipment.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const customer = await this.prisma.customer_profile.findFirst();
    const employee = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const orgUnit = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id },
    });

    if (!shipment || !customer || !employee || !orgUnit) {
      this.logger.warn(
        'Skipping BillingSeeder: missing shipment/customer/employee/orgUnit',
      );
      return;
    }

    const invoiceNumber = 'INV-2026-0001';
    const invoiceId = '00000000-0000-7000-8000-000000000901';

    const inv = await this.prisma.invoice.upsert({
      where: {
        tenant_id_invoice_number: {
          tenant_id: tenant1.id,
          invoice_number: invoiceNumber,
        },
      },
      update: {
        status: InvoiceStatus.PAID,
      },
      create: {
        id: invoiceId,
        tenant_id: tenant1.id,
        customer_profile_id: customer.id,
        customer_shipment_id: shipment.id,
        invoice_number: invoiceNumber,
        subtotal: 35.0,
        tax_amount: 5.25,
        discount_amount: 0.0,
        total_amount: 40.25,
        currency: 'USD',
        status: InvoiceStatus.PAID,
      },
    });

    const paymentId = '00000000-0000-7000-8000-000000000911';
    await this.prisma.payment.upsert({
      where: { id: paymentId },
      update: {
        status: PaymentStatus.COMPLETED,
      },
      create: {
        id: paymentId,
        tenant_id: tenant1.id,
        invoice_id: inv.id,
        collected_by_employee_id: employee.id,
        organization_unit_id: orgUnit.id,
        amount: 40.25,
        payment_method: PaymentMethod.CASH,
        transaction_reference: 'TXN-99887766',
        status: PaymentStatus.COMPLETED,
      },
    });

    this.logger.log('BillingSeeder completed.');
  }
}
