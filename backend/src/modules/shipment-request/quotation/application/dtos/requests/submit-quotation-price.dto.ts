import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class SubmitQuotationPriceDto {
  @ApiProperty({ description: 'Total quotation amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Base price component' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Weight charge component' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weightCharge?: number;

  @ApiPropertyOptional({ description: 'Extra fees component' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  extraFees?: number;
}
