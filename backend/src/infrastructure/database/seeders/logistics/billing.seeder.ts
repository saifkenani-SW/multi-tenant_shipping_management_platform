import { Injectable, Logger } from '@nestjs/common';
import {
  Currency,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

const INVOICES = [
  {
    id: '00000000-0000-7000-8000-000000000901',
    paymentId: '00000000-0000-7000-8000-000000000911',
    tenantIndex: 0,
    shipmentId: '00000000-0000-7000-8000-000000000821',
    number: 'INV-2026-0001',
    subtotal: 35000,
    handling: 2500,
    tax: 0,
    total: 37500,
    status: InvoiceStatus.PAID,
    method: PaymentMethod.CASH,
    reference: 'CASH-DMS-4412',
  },
  {
    id: '00000000-0000-7000-8000-000000000902',
    paymentId: '00000000-0000-7000-8000-000000000912',
    tenantIndex: 0,
    shipmentId: '00000000-0000-7000-8000-000000000824',
    number: 'INV-2026-0002',
    subtotal: 55000,
    handling: 0,
    tax: 0,
    total: 55000,
    status: InvoiceStatus.PAID,
    method: PaymentMethod.CASH,
    reference: 'CASH-LTK-2201',
  },
  {
    id: '00000000-0000-7000-8000-000000000903',
    paymentId: null,
    tenantIndex: 1,
    shipmentId: '00000000-0000-7000-8000-000000000822',
    number: 'INV-2026-0101',
    subtotal: 36000,
    handling: 1500,
    tax: 0,
    total: 37500,
    status: InvoiceStatus.UNPAID,
    method: PaymentMethod.CASH,
    reference: null,
  },
] as const;

@Injectable()
export class BillingSeeder implements Seeder {
  private readonly logger = new Logger(BillingSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting BillingSeeder...');

    for (const item of INVOICES) {
      const tenant = SEEDED_TENANTS[item.tenantIndex];
      const shipment = await this.prisma.customer_shipment.findUnique({
        where: { id: item.shipmentId },
      });
      const employee = await this.prisma.employee.findFirst({
        where: { tenant_id: tenant.id },
      });
      const orgUnit = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id },
      });

      if (!shipment || !employee || !orgUnit) {
        this.logger.warn(
          `Skipping invoice ${item.number}: missing shipment/employee/orgUnit`,
        );
        continue;
      }

      const inv = await this.prisma.invoice.upsert({
        where: {
          tenant_id_invoice_number: {
            tenant_id: tenant.id,
            invoice_number: item.number,
          },
        },
        update: {
          status: item.status,
          subtotal: item.subtotal,
          handling_fees: item.handling,
          total_amount: item.total,
          currency: Currency.SY,
        },
        create: {
          id: item.id,
          tenant_id: tenant.id,
          customer_shipment_id: shipment.id,
          sender_name: shipment.sender_name,
          sender_phone: shipment.sender_phone,
          receiver_name: shipment.receiver_name,
          receiver_phone: shipment.receiver_phone,
          origin_org_unit_id: shipment.origin_org_unit_id,
          destination_org_unit_id: shipment.destination_org_unit_id,
          invoice_number: item.number,
          subtotal: item.subtotal,
          handling_fees: item.handling,
          tax_amount: item.tax,
          discount_amount: 0,
          total_amount: item.total,
          currency: Currency.SY,
          status: item.status,
        },
      });

      if (!item.paymentId || item.status !== InvoiceStatus.PAID) {
        continue;
      }

      await this.prisma.payment.upsert({
        where: { id: item.paymentId },
        update: {
          status: PaymentStatus.COMPLETED,
          amount: item.total,
        },
        create: {
          id: item.paymentId,
          tenant_id: tenant.id,
          invoice_id: inv.id,
          collected_by_employee_id: employee.id,
          organization_unit_id: orgUnit.id,
          amount: item.total,
          payment_method: item.method,
          transaction_reference: item.reference,
          status: PaymentStatus.COMPLETED,
        },
      });
    }

    this.logger.log('BillingSeeder completed.');
  }
}
