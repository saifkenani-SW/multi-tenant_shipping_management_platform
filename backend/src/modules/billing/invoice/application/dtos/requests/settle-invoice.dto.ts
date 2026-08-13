import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Body for taking a payment against an invoice directly. */
export class SettleInvoiceDto {
  @ApiProperty({ description: 'Amount collected', example: 40.25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Branch where the money was taken' })
  @IsUUID()
  @IsOptional()
  organizationUnitId?: string;

  @ApiPropertyOptional({ description: 'Gateway or receipt reference' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  transactionReference?: string;
}
