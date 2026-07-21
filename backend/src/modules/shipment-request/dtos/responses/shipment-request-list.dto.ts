import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class ShipmentRequestListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RequestStatus })
  status!: RequestStatus;

  @ApiProperty()
  senderName!: string;

  @ApiProperty()
  receiverName!: string;

  @ApiProperty({ nullable: true })
  targetTenantId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedShipmentRequestListDto {
  @ApiProperty({ type: [ShipmentRequestListItemDto] })
  data!: ShipmentRequestListItemDto[];

  @ApiProperty({ example: { page: 1, limit: 10, total: 100 } })
  meta!: {
    page: number;
    limit: number;
    total: number;
  };
}
