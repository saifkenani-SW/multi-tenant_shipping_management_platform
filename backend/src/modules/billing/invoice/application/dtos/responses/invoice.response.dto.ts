import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

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

  @ApiProperty({ description: 'Sum of completed payments so far' })
  paidAmount: number;

  @ApiProperty({ description: 'What is still owed' })
  balanceDue: number;

  @ApiProperty()
  paymentResponsibility: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiPropertyOptional({ nullable: true })
  dueDate?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
