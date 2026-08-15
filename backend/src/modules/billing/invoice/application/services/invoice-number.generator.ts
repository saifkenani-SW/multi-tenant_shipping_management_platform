import { Injectable } from '@nestjs/common';
import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import {
  DEFAULT_INVOICE_PREFIX,
  INVOICE_NUMBER_MARKER,
  INVOICE_SEQUENCE_PAD,
} from '../../../constants/billing.constants';

/**
 * Builds the human readable invoice number.
 *
 * Sequential rather than time based, unlike a parcel tracking number. A parcel
 * only needs its number to be unique; an invoice number is an accounting
 * reference, and finance work expects an unbroken run per tenant per year.
 *
 * Shape: PREFIX-INV-YYYY-NNNNN, for example DAM-INV-2026-00001.
 * The prefix is the tenant's own, so two tenants never read alike, and the
 * INV marker keeps an invoice number from being mistaken for a tracking number
 * when someone reads it aloud.
 */
@Injectable()
export class InvoiceNumberGenerator {
  constructor(private readonly commandRepository: InvoiceCommandRepository) {}

  /**
   * Must run inside the same transaction as the invoice insert: that is what
   * lets a failed invoice hand its number back instead of leaving a gap.
   */
  async next(tenantId: string, tenantPrefix: string | null): Promise<string> {
    const year = new Date().getUTCFullYear();
    const sequence = await this.commandRepository.nextSequenceNumber(
      tenantId,
      year,
    );

    const prefix = this.normalizePrefix(tenantPrefix);
    const padded = String(sequence).padStart(INVOICE_SEQUENCE_PAD, '0');

    return `${prefix}-${INVOICE_NUMBER_MARKER}-${year}-${padded}`;
  }

  private normalizePrefix(tenantPrefix: string | null): string {
    const cleaned = (tenantPrefix ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    return cleaned || DEFAULT_INVOICE_PREFIX;
  }
}
