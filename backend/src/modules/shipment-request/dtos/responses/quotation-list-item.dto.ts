import { ApiProperty } from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';

export class QuotationListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  tenantName!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ enum: QuotationStatus })
  status!: QuotationStatus;

  @ApiProperty({ nullable: true })
  validUntil!: Date | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
