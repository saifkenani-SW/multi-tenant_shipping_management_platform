import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { InvoiceResponseDto } from './invoice.response.dto';

export class InvoicePaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ nullable: true })
  collectedByEmployeeId: string | null;

  @ApiProperty({ description: 'Branch where it was taken', nullable: true })
  organizationUnitId: string | null;

  @ApiProperty({ nullable: true })
  transactionReference: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class InvoiceDetailsResponseDto extends InvoiceResponseDto {
  @ApiProperty({
    description:
      'Every payment and refund recorded against this invoice, oldest first. Rows are never deleted: a pending cancel adds a REFUNDED row after the collections.',
    type: [InvoicePaymentDto],
  })
  payments: InvoicePaymentDto[];
}
