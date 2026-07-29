import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class ShipmentRequestDetailsDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RequestStatus })
  status!: RequestStatus;

  @ApiProperty()
  senderName!: string;

  @ApiProperty()
  senderPhone!: string;

  @ApiProperty()
  senderAddress!: string;

  @ApiProperty()
  receiverName!: string;

  @ApiProperty()
  receiverPhone!: string;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty()
  expectedPiecesCount!: number;

  @ApiProperty({ nullable: true })
  expectedTotalWeightKg!: number | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ nullable: true })
  targetTenantId!: string | null;

  @ApiProperty({ nullable: true, description: 'أقرب فرع لعنوان المُرسِل' })
  originOrgUnitId!: string | null;

  @ApiProperty({ nullable: true, description: 'أقرب فرع لعنوان المُستلِم' })
  destinationOrgUnitId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  cancelledAt!: Date | null;

  @ApiProperty({ nullable: true })
  cancellationReason!: string | null;
}
