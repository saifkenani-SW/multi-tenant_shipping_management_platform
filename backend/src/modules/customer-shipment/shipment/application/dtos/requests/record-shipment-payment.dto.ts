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

/** Body for taking a payment against the shipment's invoice at the counter. */
export class RecordShipmentPaymentDto {
  @ApiProperty({
    description:
      'Amount collected. Must not exceed the remaining balance. Minimum is 1000 SY or 100 USD, unless the remainder is smaller.',
    example: 1000,
  })
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
