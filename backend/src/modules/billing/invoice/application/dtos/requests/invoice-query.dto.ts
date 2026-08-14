import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentResponsibility } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

/**
 * Filters for the invoice list.
 *
 * This is the one place invoices are reached without going through a shipment,
 * because searching across many invoices has no single shipment to start from.
 */
export class InvoiceQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by owning tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Filter by the customer who owes it' })
  @IsUUID()
  @IsOptional()
  senderPhone?: string;

  @ApiPropertyOptional({ description: 'Filter by the shipment it belongs to' })
  @IsUUID()
  @IsOptional()
  customerShipmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by branch at either end of the route',
  })
  @IsUUID()
  @IsOptional()
  orgUnitId?: string;

  @ApiPropertyOptional({ enum: PaymentResponsibility })
  @IsEnum(PaymentResponsibility)
  @IsOptional()
  paymentResponsibility?: PaymentResponsibility;

  @ApiPropertyOptional({ description: 'Issued on or after this date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  issuedFrom?: Date;

  @ApiPropertyOptional({ description: 'Issued on or before this date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  issuedTo?: Date;

  @ApiPropertyOptional({ description: 'Due on or before this date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueBefore?: Date;
}
