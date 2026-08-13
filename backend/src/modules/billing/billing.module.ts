import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TenantModule } from '../tenant/tenant.module';

import { InvoiceController } from './invoice/presentation/controllers/invoice.controller';
import { InvoiceCommandService } from './invoice/application/services/invoice.command.service';
import { InvoiceQueryService } from './invoice/application/services/invoice.query.service';
import { InvoiceNumberGenerator } from './invoice/application/services/invoice-number.generator';
import { InvoiceCommandRepository } from './invoice/infrastructure/repositories/invoice.command.repository';
import { InvoiceQueryRepository } from './invoice/infrastructure/repositories/invoice.query.repository';
import { InvoiceMapper } from './invoice/application/mappers/invoice.mapper';

import { PaymentCommandRepository } from './payment/infrastructure/repositories/payment.command.repository';

import { OverdueInvoicesJob } from './jobs/overdue-invoices.job';
import { BillingFacade } from './facades/billing.facade';

/**
 * Billing module.
 *
 * Owns invoices, their payments, and the counter behind invoice numbering.
 *
 * Only BillingFacade is exported. There is no endpoint for creating an invoice:
 * an invoice exists because a shipment exists, so the customer-shipment module
 * raises it through the facade inside its own transaction. The one controller
 * here covers searching across many invoices, which has no single shipment to
 * start from.
 *
 * Outward, Billing reaches other modules only through TenantFacade, for the
 * currency and the tenant prefix used in invoice numbers.
 */
@Module({
  imports: [DatabaseModule, TenantModule, ScheduleModule.forRoot()],
  controllers: [InvoiceController],
  providers: [
    InvoiceCommandService,
    InvoiceQueryService,
    InvoiceNumberGenerator,
    InvoiceCommandRepository,
    InvoiceQueryRepository,
    InvoiceMapper,
    PaymentCommandRepository,
    OverdueInvoicesJob,
    BillingFacade,
  ],
  exports: [BillingFacade],
})
export class BillingModule {}
