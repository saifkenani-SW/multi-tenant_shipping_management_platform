import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, InvoiceStatus } from '@prisma/client';

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty({
    description: 'Human readable number, unique within the tenant',
  })
  invoiceNumber: string;

  @ApiProperty({ description: 'Sender as named on the shipment' })
  senderName: string;

  @ApiProperty()
  senderPhone: string;

  @ApiProperty({ description: 'Receiver as named on the shipment' })
  receiverName: string;

  @ApiProperty()
  receiverPhone: string;

  @ApiPropertyOptional({ nullable: true })
  customerShipmentId?: string | null;

  @ApiProperty({ description: 'Branch the shipment starts from' })
  originOrgUnitId: string;

  @ApiProperty({ description: 'Branch the shipment is bound for' })
  destinationOrgUnitId: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  handlingFees: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ description: 'Sum of completed collections (not reduced by refunds)' })
  paidAmount: number;

  @ApiProperty({
    description: 'Sum of refunded amounts recorded against this invoice',
  })
  refundedAmount: number;

  @ApiProperty({
    description:
      'What is still owed. Zero when the invoice is cancelled (including after a refund).',
  })
  balanceDue: number;

  @ApiProperty()
  paymentResponsibility: string;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiPropertyOptional({ nullable: true })
  dueDate?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
