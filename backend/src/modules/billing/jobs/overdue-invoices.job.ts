import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceCommandService } from '../invoice/application/services/invoice.command.service';

/**
 * Marks unpaid invoices overdue once their due date has passed.
 *
 * A status does not change itself: without this sweep an invoice whose due date
 * came and went would keep reading UNPAID forever. Running daily rather than
 * hourly matches what the field means — being a few hours late is not a
 * different business fact.
 */
@Injectable()
export class OverdueInvoicesJob {
  private readonly logger = new Logger(OverdueInvoicesJob.name);

  constructor(private readonly invoiceCommandService: InvoiceCommandService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue(): Promise<void> {
    try {
      const count = await this.invoiceCommandService.markOverdueInvoices();

      if (count > 0) {
        this.logger.log(`Marked ${count} invoice(s) overdue.`);
      }
    } catch (error) {
      // A failed sweep must not take the process down; the next run retries,
      // and nothing downstream depends on it having completed.
      this.logger.error(
        `Overdue invoice sweep failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
